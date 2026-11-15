import type { D1Database } from '@cloudflare/workers-types'
import { Hono, type Context } from 'hono'
import { z } from 'zod'

import { CATEGORY_IDS, isCategoryId, type CategoryId } from '../categories'
import {
  EXPIRE_MS,
  contactCandidates,
  getProviderById,
  isAreaFresh,
  saveArea,
  saveSiteContacts,
  searchNearby,
  upsertProviders,
} from './db'
import { snapToCell } from '../geo'
import { fetchProviders } from '../sources/overpass'
import { fetchSiteContacts } from '../sources/website-contacts'
import type { AppEnv } from '../types'

/** Users only ever see providers this close (km). Keeps results local: Esbjerg never gets Copenhagen. */
const MAX_RADIUS_KM = 25
const DEFAULT_RADIUS_KM = 25
const MAX_RESULTS = 100
/** Upstream area fetched around a cell centre. Must cover max radius + the distance a user can be from their cell centre. */
const FETCH_RADIUS_KM = 35
/** First, small look around the user's exact position so results can be shown while the full area loads. */
const QUICK_RADIUS_KM = 8
const QUICK_TIMEOUT_MS = 20_000
/**
 * Cloudflare cancels background (waitUntil) work 30s after the response is sent, and the response goes
 * out as soon as the quick look finishes. Cap the full fetch so it ends, and saves, inside that window
 * instead of being cut off mid-way; if it cannot finish in time, the quick results stay cached and the
 * next search tries again.
 */
const FULL_TIMEOUT_MS = 28_000
/** After a failed refresh, serve saved data for this long before asking the upstream again. */
const RETRY_AFTER_FAILURE_MS = 60_000

const coord = (min: number, max: number) => z.coerce.number().min(min).max(max)

const searchQuery = z.object({
  lat: coord(-90, 90),
  lng: coord(-180, 180),
  radius: z.coerce.number().positive().max(MAX_RADIUS_KM).default(DEFAULT_RADIUS_KM),
  category: z.string().optional(),
  q: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_RESULTS).default(MAX_RESULTS),
})

/**
 * Refreshes in progress, keyed by area + category. The Home and Search screens ask for the same
 * area at the same moment, and the free upstream is slow and throttles parallel queries, so
 * identical requests share one fetch instead of each starting their own.
 */
const inFlight = new Map<string, Promise<void>>()
/** When the last refresh of an area failed, so a failing upstream is not hammered by every poll. */
const failedAt = new Map<string, number>()

/**
 * Websites being read for contact details right now, keyed by provider id. Keeps repeated polls from
 * reading the same site twice, and tells the app to keep polling until the details have landed.
 */
const enriching = new Map<string, Promise<void>>()
/** Sites read per search. Each costs up to three outbound requests, and Workers cap those per invocation. */
const MAX_SITES_PER_SEARCH = 12
const SITE_CONCURRENCY = 4

/** Reads the websites of providers missing a phone or email, a few at a time. Never throws. */
async function enrichContacts(db: D1Database, sites: { id: string; website: string }[]) {
  const queue = [...sites]
  const worker = async () => {
    for (let site = queue.shift(); site; site = queue.shift()) {
      try {
        await saveSiteContacts(db, site.id, await fetchSiteContacts(site.website), Date.now())
      } catch (err) {
        console.error('Contact enrichment failed', err)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(SITE_CONCURRENCY, queue.length) }, worker))
}

/** A single category runs every rule for it; the broad all-categories search uses only the fast tag rules. */
const isExhaustive = (categoryId: CategoryId | undefined) => categoryId !== undefined

function refreshArea(
  db: D1Database,
  cell: { key: string; lat: number; lng: number },
  flightKey: string,
  cacheKey: string,
  categoryId: CategoryId | undefined,
  now: number
): Promise<void> {
  const existing = inFlight.get(flightKey)
  if (existing) return existing

  const run = (async () => {
    const fetchedCategories = categoryId ? [categoryId] : CATEGORY_IDS
    const exhaustive = isExhaustive(categoryId)
    const { providers, complete } = await fetchProviders(
      fetchedCategories,
      cell.lat,
      cell.lng,
      FETCH_RADIUS_KM,
      exhaustive,
      { timeoutMs: FULL_TIMEOUT_MS }
    )
    await saveArea(db, cell.key, cacheKey, providers, now, {
      categories: fetchedCategories,
      lat: cell.lat,
      lng: cell.lng,
      radiusKm: FETCH_RADIUS_KM,
      // Without the name rules "not returned" does not mean "gone", so only exhaustive fetches may delete.
      complete: complete && exhaustive,
    })
  })()
    .then(
      () => {
        failedAt.delete(flightKey)
      },
      (err) => {
        failedAt.set(flightKey, Date.now())
        throw err
      }
    )
    .finally(() => inFlight.delete(flightKey))

  inFlight.set(flightKey, run)
  return run
}

/** A small, fast fetch around the user so the first results do not wait for the whole area. */
async function quickLook(
  db: D1Database,
  at: { lat: number; lng: number },
  categoryId: CategoryId | undefined,
  now: number
): Promise<void> {
  const { providers } = await fetchProviders(
    categoryId ? [categoryId] : CATEGORY_IDS,
    at.lat,
    at.lng,
    QUICK_RADIUS_KM,
    isExhaustive(categoryId),
    { timeoutMs: QUICK_TIMEOUT_MS }
  )
  await upsertProviders(db, providers, now)
}

/** Keep a promise running after the response is sent (Workers cut off work that is not registered). */
function runInBackground(c: Context<AppEnv>, task: Promise<unknown>) {
  try {
    c.executionCtx.waitUntil(task)
  } catch {
    // No execution context (e.g. in tests): the promise still runs to completion on its own.
  }
}

/** Service providers near a location: GET /api/providers and GET /api/providers/:id */
export const providerRoutes = new Hono<AppEnv>()

providerRoutes.get('/', async (c) => {
  const parsed = searchQuery.safeParse(c.req.query())
  if (!parsed.success) return c.json({ error: 'Invalid query', issues: parsed.error.issues }, 400)
  const { lat, lng, radius, category, q, limit } = parsed.data
  if (category !== undefined && !isCategoryId(category)) {
    return c.json({ error: `Unknown category: ${category}` }, 400)
  }
  const categoryId = category as CategoryId | undefined

  const cell = snapToCell(lat, lng)
  const cacheKey = categoryId ?? 'all'
  const flightKey = `${cell.key}|${cacheKey}`
  const now = Date.now()

  // `refreshing`: the full area is still being fetched in the background; the app asks again shortly.
  let refreshing = false
  let upstreamFailed = false
  if (!(await isAreaFresh(c.env.DB, cell.key, cacheKey, now))) {
    const lastFailure = failedAt.get(flightKey)
    if (lastFailure !== undefined && now - lastFailure < RETRY_AFTER_FAILURE_MS) {
      upstreamFailed = true // serve what we have instead of asking a struggling upstream again
    } else {
      const alreadyRunning = inFlight.has(flightKey)
      const full = refreshArea(c.env.DB, cell, flightKey, cacheKey, categoryId, now).then(
        () => true,
        (err) => {
          console.error('Upstream fetch failed', err)
          return false
        }
      )
      runInBackground(c, full)
      if (!alreadyRunning) {
        // Answer as soon as either the quick look around the user or the whole area is done.
        const quick = quickLook(c.env.DB, { lat, lng }, categoryId, now).then(
          () => 'quick' as const,
          (err) => {
            console.error('Quick fetch failed', err)
            return 'quick' as const
          }
        )
        const first = await Promise.race([quick, full.then((ok) => (ok ? ('full' as const) : ('full-failed' as const)))])
        // If the whole area failed first, the nearby results may still be on their way: do not report
        // "unavailable" before the quick look has had its say.
        if (first === 'full-failed') await quick
      }
      refreshing = inFlight.has(flightKey)
      upstreamFailed = !refreshing && failedAt.has(flightKey)
    }
  }

  // Normally hide providers that refreshes stopped confirming; if upstream is down keep serving what we have.
  const providers = await searchNearby(c.env.DB, {
    lat,
    lng,
    radiusKm: radius,
    category,
    q: q || undefined,
    limit,
    confirmedSince: upstreamFailed ? undefined : now - EXPIRE_MS,
  })
  if (upstreamFailed && providers.length === 0) {
    return c.json({ error: 'Provider data is temporarily unavailable. Please try again shortly.' }, 503)
  }

  // Fill in missing phone numbers and emails from the nearest providers' own websites, in the
  // background. The app keeps polling while this runs, so the details appear without a new search.
  const sites = (await contactCandidates(c.env.DB, providers.map((p) => p.id), now, MAX_SITES_PER_SEARCH)).filter(
    (s) => !enriching.has(s.id)
  )
  if (sites.length > 0) {
    const run = enrichContacts(c.env.DB, sites).finally(() => sites.forEach((s) => enriching.delete(s.id)))
    sites.forEach((s) => enriching.set(s.id, run))
    runInBackground(c, run)
  }
  const enrichingNow = providers.some((p) => enriching.has(p.id))

  return c.json({ providers, radiusKm: radius, stale: upstreamFailed, refreshing: refreshing || enrichingNow })
})

providerRoutes.get('/:id', async (c) => {
  const near = z.object({ lat: coord(-90, 90), lng: coord(-180, 180) }).safeParse(c.req.query())
  const provider = await getProviderById(
    c.env.DB,
    c.req.param('id'),
    near.success ? near.data : undefined,
    Date.now() - EXPIRE_MS
  )
  if (!provider) return c.json({ error: 'Provider not found' }, 404)
  return c.json({ provider })
})

type NominatimPlace = { display_name: string; lat: string; lon: string; name?: string }

/** Turn a typed town/postcode into coordinates (used when the user declines GPS): GET /api/geocode */
export const geocodeRoutes = new Hono<AppEnv>()

geocodeRoutes.get('/', async (c) => {
  const q = z.string().trim().min(2).max(100).safeParse(c.req.query('q'))
  if (!q.success) return c.json({ error: 'Query "q" must be 2-100 characters' }, 400)

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q.data)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '5')
  const countries = c.env.GEOCODE_COUNTRIES
  if (countries) url.searchParams.set('countrycodes', countries)

  // Nominatim asks for an identifying User-Agent and caching; one result set per query is cached a day.
  const res = await fetch(url, {
    headers: { 'user-agent': 'HandyService/0.1' },
    cf: { cacheTtl: 86400, cacheEverything: true },
  } as RequestInit)
  if (!res.ok) return c.json({ error: 'Geocoding is temporarily unavailable' }, 502)
  const places = (await res.json()) as NominatimPlace[]
  return c.json({
    places: places.map((p) => ({
      label: p.display_name,
      name: p.name || p.display_name.split(',')[0],
      lat: Number(p.lat),
      lng: Number(p.lon),
    })),
  })
})
