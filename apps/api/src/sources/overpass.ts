import { categoriesForTags, overpassStatements, type CategoryId } from '../categories'
import { haversineKm } from '../geo'

/** Public Overpass instances, tried in order. Free, but shared: keep calls rare (we cache in D1). */
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

/**
 * We store at most this many providers per fetched area: the nearest to the area centre.
 * Searches return at most 100 (see MAX_RESULTS in index.ts); storing more than that keeps results
 * correct for users who are not exactly at the cell centre.
 */
export const MAX_PROVIDERS_PER_FETCH = 300

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
    website: tags.website ?? tags['contact:website'] ?? null,
  }
}

async function runQuery(query: string): Promise<OverpassElement[]> {
  let lastError: unknown
  for (const endpoint of ENDPOINTS) {
    // One attempt per endpoint (then fall back to the mirror): a cold fetch already takes a while and
    // the app gives up after 60s, so long retry loops would only outlast the caller.
    for (let attempt = 0; attempt < 1; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'HandyService/0.1' },
          body: new URLSearchParams({ data: query }),
        })
        if (res.ok) {
          const json = (await res.json()) as { elements?: OverpassElement[]; remark?: string }
          // A query that times out or runs out of memory after headers are sent still answers 200,
          // with empty/partial elements and the error in `remark`. Never treat that as a result.
          if (json.remark && RUNTIME_ERROR.test(json.remark)) {
            lastError = new Error(`Overpass ${endpoint} query failed: ${json.remark}`)
          } else {
            return json.elements ?? []
          }
        } else {
          lastError = new Error(`Overpass ${endpoint} responded ${res.status}`)
        }
      } catch (err) {
        lastError = err
      }
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Overpass request failed')
}

/**
 * Providers of the given categories within `radiusKm` of a point, nearest first,
 * capped at MAX_PROVIDERS_PER_FETCH.
 */
export async function fetchProviders(
  categories: readonly CategoryId[],
  lat: number,
  lng: number,
  radiusKm: number
): Promise<SourceProvider[]> {
  const statements = overpassStatements(categories, Math.round(radiusKm * 1000), lat, lng)
  // No `out N` limit: Overpass applies it in object-id order, before any distance sorting, so it
  // could drop nearby providers. We fetch every candidate and keep the nearest ones ourselves.
  const query = `[out:json][timeout:30];(${statements.join('')});out center tags;`
  const elements = await runQuery(query)

  const seen = new Set<string>()
  const providers: SourceProvider[] = []
  for (const el of elements) {
    const p = toProvider(el)
    if (p && !seen.has(p.id)) {
      seen.add(p.id)
      providers.push(p)
    }
  }
  return providers
    .sort((a, b) => haversineKm(lat, lng, a.lat, a.lng) - haversineKm(lat, lng, b.lat, b.lng))
    .slice(0, MAX_PROVIDERS_PER_FETCH)
}
