import { Hono } from 'hono'
import { z } from 'zod'

import { CATEGORY_IDS, isCategoryId, type CategoryId } from '../categories'
import { EXPIRE_MS, getProviderById, isAreaFresh, saveArea, searchNearby } from './db'
import { snapToCell } from '../geo'
import { fetchProviders } from '../sources/overpass'
import type { AppEnv } from '../types'

/** Users only ever see providers this close (km). Keeps results local: Esbjerg never gets Copenhagen. */
const MAX_RADIUS_KM = 25
const DEFAULT_RADIUS_KM = 25
const MAX_RESULTS = 100
/** Upstream area fetched around a cell centre. Must cover max radius + the distance a user can be from their cell centre. */
const FETCH_RADIUS_KM = 35

const coord = (min: number, max: number) => z.coerce.number().min(min).max(max)

const searchQuery = z.object({
  lat: coord(-90, 90),
  lng: coord(-180, 180),
  radius: z.coerce.number().positive().max(MAX_RADIUS_KM).default(DEFAULT_RADIUS_KM),
  category: z.string().optional(),
  q: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_RESULTS).default(MAX_RESULTS),
})

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

  // Make sure the area around the user has been fetched recently; otherwise pull it from OSM.
  const cell = snapToCell(lat, lng)
  const cacheKey = categoryId ?? 'all'
  const now = Date.now()
  let upstreamFailed = false
  if (!(await isAreaFresh(c.env.DB, cell.key, cacheKey, now))) {
    try {
      const fetchedCategories = categoryId ? [categoryId] : CATEGORY_IDS
      // A single category runs every rule for it. The broad all-categories search (the Home screen)
      // uses only the fast tag rules, so it stays quick even in a big city.
      const exhaustive = categoryId !== undefined
      const { providers: fetched, complete } = await fetchProviders(
        fetchedCategories,
        cell.lat,
        cell.lng,
        FETCH_RADIUS_KM,
        exhaustive
      )
      await saveArea(c.env.DB, cell.key, cacheKey, fetched, now, {
        categories: fetchedCategories,
        lat: cell.lat,
        lng: cell.lng,
        radiusKm: FETCH_RADIUS_KM,
        // Without the name rules "not returned" does not mean "gone", so only exhaustive fetches may delete.
        complete: complete && exhaustive,
      })
    } catch (err) {
      // Serve whatever we already have (possibly stale) rather than failing the search.
      console.error('Upstream fetch failed', err)
      upstreamFailed = true
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
  return c.json({ providers, radiusKm: radius, stale: upstreamFailed })
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
