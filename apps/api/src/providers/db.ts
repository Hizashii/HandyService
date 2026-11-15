import type { D1Database } from '@cloudflare/workers-types'

import { boundingBox, haversineKm } from '../geo'
import type { SourceProvider } from '../sources/overpass'

export type Rating = { source: string; rating: number; reviewCount: number; url: string | null }

export type Provider = Omit<SourceProvider, 'source'> & {
  source: string
  ratings: Rating[]
  distanceKm?: number
}

type ProviderRow = {
  id: string
  source: string
  name: string
  categories: string
  lat: number
  lng: number
  city: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  site_phone: string | null
  site_email: string | null
}

type RatingRow = { provider_id: string; source: string; rating: number; review_count: number; url: string | null }

/** Re-fetch an area after a week; provider data changes slowly. */
export const FRESH_MS = 7 * 24 * 60 * 60 * 1000

/**
 * A provider that no successful refresh has confirmed for this long is treated as gone
 * (deleted from OSM or no longer tagged as a service). Twice the refresh interval, so one
 * missed refresh never hides a real business.
 */
export const EXPIRE_MS = 2 * FRESH_MS

export async function isAreaFresh(db: D1Database, cell: string, category: string, now: number) {
  const row = await db
    .prepare('SELECT fetched_at FROM area_fetches WHERE cell = ? AND category = ?')
    .bind(cell, category)
    .first<{ fetched_at: number }>()
  return row !== null && now - row.fetched_at < FRESH_MS
}

/** The area an upstream fetch covered, used to drop providers that no longer exist in it. */
export type FetchScope = {
  categories: readonly string[]
  lat: number
  lng: number
  radiusKm: number
  /** Only a complete fetch (nothing truncated) can prove a provider is gone. */
  complete: boolean
}

/** D1 limits how many statements one batch may hold, so write in chunks. */
const BATCH_SIZE = 50

/**
 * Ids of cached providers inside the fetched area that the fetch no longer returned and that have
 * no category outside the fetched set, i.e. they were deleted from the source or lost their tags.
 */
async function findVanished(db: D1Database, scope: FetchScope, returned: Set<string>): Promise<string[]> {
  if (!scope.complete) return []
  const box = boundingBox(scope.lat, scope.lng, scope.radiusKm)
  const { results } = await db
    .prepare('SELECT id, categories, lat, lng FROM providers WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?')
    .bind(box.minLat, box.maxLat, box.minLng, box.maxLng)
    .all<Pick<ProviderRow, 'id' | 'categories' | 'lat' | 'lng'>>()
  const fetched = new Set(scope.categories)
  return results
    .filter(
      (row) =>
        !returned.has(row.id) &&
        haversineKm(scope.lat, scope.lng, row.lat, row.lng) <= scope.radiusKm &&
        (JSON.parse(row.categories) as string[]).every((c) => fetched.has(c))
    )
    .map((row) => row.id)
}

function upsertStatements(db: D1Database, providers: SourceProvider[], now: number) {
  const upsert = db.prepare(
    `INSERT INTO providers (id, source, name, categories, lat, lng, city, address, phone, email, website, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, categories = excluded.categories, lat = excluded.lat, lng = excluded.lng,
       city = excluded.city, address = excluded.address, phone = excluded.phone, email = excluded.email,
       website = excluded.website, fetched_at = excluded.fetched_at`
  )
  return providers.map((p) =>
    upsert.bind(p.id, p.source, p.name, JSON.stringify(p.categories), p.lat, p.lng, p.city, p.address, p.phone, p.email, p.website, now)
  )
}

/**
 * Stores providers without marking any area as fetched and without removing anything. Used for the
 * quick first look around the user, so those results can be shown while the full area is still loading.
 */
export async function upsertProviders(db: D1Database, providers: SourceProvider[], now: number) {
  const statements = upsertStatements(db, providers, now)
  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    await db.batch(statements.slice(i, i + BATCH_SIZE))
  }
}

export async function saveArea(
  db: D1Database,
  cell: string,
  category: string,
  providers: SourceProvider[],
  now: number,
  scope: FetchScope
) {
  const vanished = await findVanished(db, scope, new Set(providers.map((p) => p.id)))
  const statements = upsertStatements(db, providers, now)
  for (const id of vanished) {
    statements.push(db.prepare('DELETE FROM providers WHERE id = ?').bind(id))
  }
  // The "area fetched" marker goes last so a failed write never marks an area as fresh.
  statements.push(
    db
      .prepare('INSERT OR REPLACE INTO area_fetches (cell, category, fetched_at) VALUES (?, ?, ?)')
      .bind(cell, category, now)
  )
  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    await db.batch(statements.slice(i, i + BATCH_SIZE))
  }
}

async function attachRatings(db: D1Database, rows: ProviderRow[]): Promise<Map<string, Rating[]>> {
  const byProvider = new Map<string, Rating[]>()
  if (rows.length === 0) return byProvider
  // D1 caps bound parameters per query, so look ratings up in chunks.
  for (let i = 0; i < rows.length; i += 50) {
    const ids = rows.slice(i, i + 50).map((r) => r.id)
    const { results } = await db
      .prepare(`SELECT * FROM provider_ratings WHERE provider_id IN (${ids.map(() => '?').join(',')})`)
      .bind(...ids)
      .all<RatingRow>()
    for (const r of results) {
      const list = byProvider.get(r.provider_id) ?? []
      list.push({ source: r.source, rating: r.rating, reviewCount: r.review_count, url: r.url })
      byProvider.set(r.provider_id, list)
    }
  }
  return byProvider
}

function toProvider(row: ProviderRow, ratings: Rating[], distanceKm?: number): Provider {
  return {
    id: row.id,
    source: row.source,
    name: row.name,
    categories: JSON.parse(row.categories),
    lat: row.lat,
    lng: row.lng,
    city: row.city,
    address: row.address,
    // OpenStreetMap values win; details read from the provider's own website only fill gaps.
    phone: row.phone ?? row.site_phone,
    email: row.email ?? row.site_email,
    website: row.website,
    ratings,
    distanceKm,
  }
}

/** Providers within `radiusKm` of a point, nearest first, at most `limit`. */
export async function searchNearby(
  db: D1Database,
  opts: {
    lat: number
    lng: number
    radiusKm: number
    category?: string
    q?: string
    limit: number
    /** Hide providers not confirmed by a refresh since this unix-ms time. Omit to serve stale data (upstream down). */
    confirmedSince?: number
  }
): Promise<Provider[]> {
  const box = boundingBox(opts.lat, opts.lng, opts.radiusKm)
  const where = ['lat BETWEEN ? AND ?', 'lng BETWEEN ? AND ?']
  const params: (string | number)[] = [box.minLat, box.maxLat, box.minLng, box.maxLng]
  if (opts.confirmedSince !== undefined) {
    where.push('fetched_at >= ?')
    params.push(opts.confirmedSince)
  }
  if (opts.category) {
    where.push('categories LIKE ?')
    params.push(`%"${opts.category}"%`)
  }
  if (opts.q) {
    where.push("name LIKE ? ESCAPE '\\'")
    params.push(`%${opts.q.replace(/[\\%_]/g, '\\$&')}%`)
  }
  const { results } = await db
    .prepare(`SELECT * FROM providers WHERE ${where.join(' AND ')}`)
    .bind(...params)
    .all<ProviderRow>()

  const nearby = results
    .map((row) => ({ row, km: haversineKm(opts.lat, opts.lng, row.lat, row.lng) }))
    .filter((x) => x.km <= opts.radiusKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, opts.limit)

  const ratings = await attachRatings(db, nearby.map((x) => x.row))
  return nearby.map(({ row, km }) => toProvider(row, ratings.get(row.id) ?? [], Math.round(km * 10) / 10))
}

export async function getProviderById(
  db: D1Database,
  id: string,
  from?: { lat: number; lng: number },
  /** Treat a provider no refresh has confirmed since this unix-ms time as gone. */
  confirmedSince?: number
): Promise<Provider | null> {
  const row = await db
    .prepare('SELECT * FROM providers WHERE id = ? AND fetched_at >= ?')
    .bind(id, confirmedSince ?? 0)
    .first<ProviderRow>()
  if (!row) return null
  const ratings = await attachRatings(db, [row])
  const km = from ? Math.round(haversineKm(from.lat, from.lng, row.lat, row.lng) * 10) / 10 : undefined
  return toProvider(row, ratings.get(row.id) ?? [], km)
}

/** Look at a provider's website again after this long (found something or not). */
export const CONTACT_RECHECK_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Providers among `ids` that have a website, lack a phone or email in OpenStreetMap, and have not had
 * their website checked recently. Judged on the OSM fields only: values read from a website are
 * re-checked once they are older than CONTACT_RECHECK_MS, so changed contact details are picked up. At most `limit`, in the order given (nearest first).
 */
export async function contactCandidates(
  db: D1Database,
  ids: string[],
  now: number,
  limit: number
): Promise<{ id: string; website: string }[]> {
  const found = new Map<string, string>()
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    const { results } = await db
      .prepare(
        `SELECT id, website FROM providers
         WHERE id IN (${chunk.map(() => '?').join(',')})
           AND website IS NOT NULL
           AND (contact_checked_at IS NULL OR contact_checked_at < ?)
           AND (phone IS NULL OR email IS NULL)`
      )
      .bind(...chunk, now - CONTACT_RECHECK_MS)
      .all<{ id: string; website: string }>()
    for (const r of results) found.set(r.id, r.website)
  }
  return ids
    .filter((id) => found.has(id))
    .slice(0, limit)
    .map((id) => ({ id, website: found.get(id)! }))
}

/**
 * Records the outcome of reading a provider's website. A successful read replaces the stored values,
 * so a contact the business has withdrawn disappears. A failed read keeps what we had (one outage must
 * not erase good data) and retries in a day instead of waiting a month. Never touches OSM columns.
 */
export async function saveSiteContacts(
  db: D1Database,
  id: string,
  found: { phone: string | null; email: string | null; read: boolean },
  now: number
) {
  if (found.read) {
    await db
      .prepare('UPDATE providers SET site_phone = ?, site_email = ?, contact_checked_at = ? WHERE id = ?')
      .bind(found.phone, found.email, now, id)
      .run()
    return
  }
  const retryInOneDay = now - CONTACT_RECHECK_MS + 24 * 60 * 60 * 1000
  await db.prepare('UPDATE providers SET contact_checked_at = ? WHERE id = ?').bind(retryInOneDay, id).run()
}
