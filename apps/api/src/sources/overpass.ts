import { categoriesForTags, overpassStatements, type CategoryId } from '../categories'
import { haversineKm } from '../geo'

/** Public Overpass instances, tried in order. Free, but shared: keep calls rare (we cache in D1). */
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

/** We keep at most this many providers per fetched area: the nearest to the area centre. */
export const MAX_PROVIDERS_PER_FETCH = 100

/** Fetch a few more than we keep so the nearest-100 cut is meaningful. */
const FETCH_LIMIT = 300

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
    // Two attempts per endpoint; the public servers often answer 429/502 when busy.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'HandyService/0.1' },
          body: new URLSearchParams({ data: query }),
        })
        if (res.ok) {
          const json = (await res.json()) as { elements?: OverpassElement[] }
          return json.elements ?? []
        }
        lastError = new Error(`Overpass ${endpoint} responded ${res.status}`)
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
  const query = `[out:json][timeout:25];(${statements.join('')});out center tags ${FETCH_LIMIT};`
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
