import { categoriesForTags, overpassStatements, type CategoryId } from '../categories'
import { haversineKm } from '../geo'

/**
 * Public Overpass instances, in the order we try them. Free and shared: keep calls rare (we cache in D1).
 * Measured: the openstreetmap.fr mirror answered a 6 km query in ~6s while the others timed out at 40s+
 * on the same day, so it goes first and the rest are fallbacks.
 */
const ENDPOINTS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

/** If a server has not answered after this long, also ask the next one and take whichever answers first. */
const HEDGE_DELAY_MS = 4_000

export type QueryOptions = {
  /** Give up on the whole query after this long. */
  timeoutMs?: number
  hedgeDelayMs?: number
  endpoints?: readonly string[]
}

/**
 * We store at most this many providers per fetched area: the nearest to the area centre.
 * Searches return at most 100 (see MAX_RESULTS in index.ts); storing more than that keeps results
 * correct for users who are not exactly at the cell centre.
 */
export const MAX_PROVIDERS_PER_FETCH = 300

/**
 * Longest we wait on one Overpass server before moving on to the next. The free public servers take
 * 20-45s for even a modest query (measured: a combined 13-tag query for a 35 km area took ~44s), so
 * a shorter limit would abort it every time and nothing would ever be cached.
 */
const ATTEMPT_TIMEOUT_MS = 55_000

/** Remarks Overpass puts in an HTTP 200 body when a query died part-way through. */
const RUNTIME_ERROR = /runtime error|timed out|out of memory|too many requests/i

export type SourceProvider = {
  id: string
  source: 'osm'
  name: string
  categories: CategoryId[]
  lat: number
  lng: number
  city: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
}

type OverpassElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function toProvider(el: OverpassElement): SourceProvider | null {
  const tags = el.tags ?? {}
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  const name = tags.name?.trim()
  if (!name || lat === undefined || lng === undefined) return null

  const categories = categoriesForTags(tags)
  if (categories.length === 0) return null

  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ')
  const place = [tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ')
  const address = [street, place].filter(Boolean).join(', ')

  return {
    id: `osm_${el.type[0]}${el.id}`,
    source: 'osm',
    name,
    categories,
    lat,
    lng,
    city: tags['addr:city'] ?? null,
    address: address || null,
    phone: tags.phone ?? tags['contact:phone'] ?? null,
    // OSM allows several addresses in one tag ("a@x.dk;b@x.dk"); keep the first.
    email: (tags.email ?? tags['contact:email'])?.split(';')[0]?.trim() || null,
    website: tags.website ?? tags['contact:website'] ?? null,
  }
}

async function requestOne(endpoint: string, query: string, signal: AbortSignal): Promise<OverpassElement[]> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'HandyService/0.1' },
    body: new URLSearchParams({ data: query }),
    signal,
  })
  if (!res.ok) throw new Error(`Overpass ${endpoint} responded ${res.status}`)
  const json = (await res.json()) as { elements?: OverpassElement[]; remark?: string }
  // A query that times out or runs out of memory after headers are sent still answers 200,
  // with empty/partial elements and the error in `remark`. Never treat that as a result.
  if (json.remark && RUNTIME_ERROR.test(json.remark)) {
    throw new Error(`Overpass ${endpoint} query failed: ${json.remark}`)
  }
  return json.elements ?? []
}

/**
 * Runs a query against the public servers and returns the first good answer. The first server is asked
 * straight away; each next one is added if the previous has not answered within `hedgeDelayMs`, or
 * failed. Losing requests are cancelled. The whole thing is bounded by `timeoutMs`, so a busy upstream
 * can never hold a search open indefinitely.
 */
function runQuery(query: string, opts: QueryOptions = {}): Promise<OverpassElement[]> {
  const { timeoutMs = ATTEMPT_TIMEOUT_MS, hedgeDelayMs = HEDGE_DELAY_MS, endpoints = ENDPOINTS } = opts

  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timers: ReturnType<typeof setTimeout>[] = []
    let next = 0
    let failed = 0
    let lastError: unknown
    let settled = false

    const settle = (finish: () => void) => {
      if (settled) return
      settled = true
      controller.abort()
      timers.forEach(clearTimeout)
      finish()
    }

    const launch = () => {
      if (settled || next >= endpoints.length) return
      const endpoint = endpoints[next++]
      if (next < endpoints.length) timers.push(setTimeout(launch, hedgeDelayMs))
      requestOne(endpoint, query, controller.signal).then(
        (elements) => settle(() => resolve(elements)),
        (err) => {
          lastError = err
          failed++
          if (failed === endpoints.length) {
            settle(() => reject(lastError instanceof Error ? lastError : new Error('Overpass request failed')))
          } else {
            launch() // a server that fails fast should not make us wait for the hedge timer
          }
        }
      )
    }

    timers.push(setTimeout(() => settle(() => reject(new Error('Overpass timed out'))), timeoutMs))
    launch()
  })
}

/**
 * Providers of the given categories within `radiusKm` of a point, nearest first,
 * capped at MAX_PROVIDERS_PER_FETCH.
 */
export type FetchResult = {
  providers: SourceProvider[]
  /** True when nothing was cut by MAX_PROVIDERS_PER_FETCH, so `providers` is every match in the area. */
  complete: boolean
}

export async function fetchProviders(
  categories: readonly CategoryId[],
  lat: number,
  lng: number,
  radiusKm: number,
  /** Skip the slow name-regex rules (used for broad all-category searches). */
  includeNameRules = true,
  queryOptions?: QueryOptions
): Promise<FetchResult> {
  const statements = overpassStatements(categories, Math.round(radiusKm * 1000), lat, lng, includeNameRules)
  // No `out N` limit: Overpass applies it in object-id order, before any distance sorting, so it
  // could drop nearby providers. We fetch every candidate and keep the nearest ones ourselves.
  const query = `[out:json][timeout:50];(${statements.join('')});out center tags;`
  const elements = await runQuery(query, queryOptions)

  const seen = new Set<string>()
  const providers: SourceProvider[] = []
  for (const el of elements) {
    const p = toProvider(el)
    if (p && !seen.has(p.id)) {
      seen.add(p.id)
      providers.push(p)
    }
  }
  providers.sort((a, b) => haversineKm(lat, lng, a.lat, a.lng) - haversineKm(lat, lng, b.lat, b.lng))
  return {
    providers: providers.slice(0, MAX_PROVIDERS_PER_FETCH),
    complete: providers.length <= MAX_PROVIDERS_PER_FETCH,
  }
}
