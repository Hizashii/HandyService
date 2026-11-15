import { boundingBox, haversineKm } from './geo'
import type { SourceProvider } from './sources/overpass'

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
  website: string | null
}

type RatingRow = { provider_id: string; source: string; rating: number; review_count: number; url: string | null }

/** Re-fetch an area after a week; provider data changes slowly. */
export const FRESH_MS = 7 * 24 * 60 * 60 * 1000

export async function isAreaFresh(db: D1Database, cell: string, category: string, now: number) {
  const row = await db
    .prepare('SELECT fetched_at FROM area_fetches WHERE cell = ? AND category = ?')
    .bind(cell, category)
    .first<{ fetched_at: number }>()
  return row !== null && now - row.fetched_at < FRESH_MS
}

export async function saveArea(
  db: D1Database,
  cell: string,
  category: string,
  providers: SourceProvider[],
  now: number
) {
  const upsert = db.prepare(
    `INSERT INTO providers (id, source, name, categories, lat, lng, city, address, phone, website, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, categories = excluded.categories, lat = excluded.lat, lng = excluded.lng,
       city = excluded.city, address = excluded.address, phone = excluded.phone,
       website = excluded.website, fetched_at = excluded.fetched_at`
  )
  const statements = providers.map((p) =>
    upsert.bind(p.id, p.source, p.name, JSON.stringify(p.categories), p.lat, p.lng, p.city, p.address, p.phone, p.website, now)
  )
  statements.push(
    db
      .prepare('INSERT OR REPLACE INTO area_fetches (cell, category, fetched_at) VALUES (?, ?, ?)')
      .bind(cell, category, now)
  )
  await db.batch(statements)
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
    phone: row.phone,
    website: row.website,
    ratings,
    distanceKm,
  }
}

/** Providers within `radiusKm` of a point, nearest first, at most `limit`. */
export async function searchNearby(
  db: D1Database,
  opts: { lat: number; lng: number; radiusKm: number; category?: string; q?: string; limit: number }
): Promise<Provider[]> {
  const box = boundingBox(opts.lat, opts.lng, opts.radiusKm)
  const where = ['lat BETWEEN ? AND ?', 'lng BETWEEN ? AND ?']
  const params: (string | number)[] = [box.minLat, box.maxLat, box.minLng, box.maxLng]
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
  from?: { lat: number; lng: number }
): Promise<Provider | null> {
  const row = await db.prepare('SELECT * FROM providers WHERE id = ?').bind(id).first<ProviderRow>()
  if (!row) return null
  const ratings = await attachRatings(db, [row])
  const km = from ? Math.round(haversineKm(from.lat, from.lng, row.lat, row.lng) * 10) / 10 : undefined
  return toProvider(row, ratings.get(row.id) ?? [], km)
}
