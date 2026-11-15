import { afterEach, describe, expect, it, vi } from 'vitest';

import { categoriesForTags, overpassStatements } from '../src/categories';
import { boundingBox, haversineKm, snapToCell } from '../src/geo';
import { fetchProviders } from '../src/sources/overpass';

/** Pull the regex an Overpass statement applies to `key` and compile it as JS (Overpass uses ERE; this pattern is valid in both). */
function tagRegex(statement: string, key: string): RegExp {
  const match = statement.match(new RegExp(`\\["${key}"~"([^"]+)"\\]`));
  if (!match) throw new Error(`no ${key} regex in ${statement}`);
  return new RegExp(match[1]);
}

describe('overpassStatements', () => {
  const [carpentry] = overpassStatements(['carpentry'], 25000, 55.47, 8.45);
  const re = tagRegex(carpentry, 'craft');

  it('matches single and semicolon-separated craft values', () => {
    expect(re.test('carpenter')).toBe(true);
    expect(re.test('joiner')).toBe(true);
    expect(re.test('carpenter;joiner')).toBe(true);
    expect(re.test('plumber;carpenter')).toBe(true);
    expect(re.test('carpenter; joiner')).toBe(true);
  });

  it('does not match other crafts or longer words', () => {
    expect(re.test('plumber')).toBe(false);
    expect(re.test('carpenters')).toBe(false);
    expect(re.test('notacarpenter')).toBe(false);
  });

  it('limits name-regex rules to business-type objects', () => {
    const statements = overpassStatements(['cleaning'], 25000, 55.47, 8.45);
    const nameRules = statements.filter((s) => s.includes('"name"'));
    expect(nameRules.length).toBeGreaterThan(0);
    for (const rule of nameRules) expect(rule).toMatch(/\["(office|craft|shop)"\]\["name"/);
  });
});

describe('categoriesForTags', () => {
  it('assigns every category of a multi-valued tag', () => {
    expect(categoriesForTags({ name: 'Byg ApS', craft: 'carpenter;plumber' }).sort()).toEqual([
      'carpentry',
      'plumbing',
    ]);
  });

  it('recognises Danish name keywords', () => {
    expect(categoriesForTags({ name: 'Dan Ren Rengøring', office: 'company' })).toContain('cleaning');
  });

  it('returns nothing for unrelated objects', () => {
    expect(categoriesForTags({ name: 'Cafe', amenity: 'cafe' })).toEqual([]);
  });
});

describe('geo helpers', () => {
  const esbjerg = { lat: 55.4765, lng: 8.4594 };
  const copenhagen = { lat: 55.6761, lng: 12.5683 };

  it('computes real-world distances', () => {
    expect(haversineKm(esbjerg.lat, esbjerg.lng, esbjerg.lat, esbjerg.lng)).toBeCloseTo(0, 5);
    const km = haversineKm(esbjerg.lat, esbjerg.lng, copenhagen.lat, copenhagen.lng);
    expect(km).toBeGreaterThan(250);
    expect(km).toBeLessThan(290);
  });

  it('bounding box contains every point within the radius', () => {
    const box = boundingBox(esbjerg.lat, esbjerg.lng, 25);
    const north = { lat: esbjerg.lat + 24 / 111, lng: esbjerg.lng };
    expect(north.lat).toBeLessThan(box.maxLat);
    expect(copenhagen.lng).toBeGreaterThan(box.maxLng);
  });

  it('snaps nearby points to the same cell and far points to another', () => {
    expect(snapToCell(55.471, 8.452).key).toBe(snapToCell(55.479, 8.458).key);
    expect(snapToCell(esbjerg.lat, esbjerg.lng).key).not.toBe(snapToCell(copenhagen.lat, copenhagen.lng).key);
  });
});

describe('fetchProviders (hedged Overpass servers)', () => {
  const element = {
    type: 'node',
    id: 1,
    lat: 55.4,
    lon: 8.4,
    tags: {
      name: 'Test Byg',
      craft: 'carpenter',
      'contact:email': 'first@test.dk; second@test.dk',
      'contact:phone': '+4512345678',
    },
  };
  const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  const opts = { hedgeDelayMs: 20, timeoutMs: 2000, endpoints: ['https://a.test/i', 'https://b.test/i'] };

  function stubFetch(handlers: Record<string, (signal: AbortSignal) => Promise<Response>>) {
    const aborted: string[] = [];
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      const signal = init.signal as AbortSignal;
      signal.addEventListener('abort', () => aborted.push(String(url)));
      return handlers[String(url)](signal);
    });
    return aborted;
  }
  const hangs = (signal: AbortSignal) =>
    new Promise<Response>((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));

  afterEach(() => vi.unstubAllGlobals());

  it('takes the answer from the second server when the first never replies, and cancels the first', async () => {
    const aborted = stubFetch({ 'https://a.test/i': hangs, 'https://b.test/i': () => ok({ elements: [element] }) });
    const { providers } = await fetchProviders(['carpentry'], 55.4, 8.4, 5, true, opts);
    expect(providers).toHaveLength(1);
    expect(providers[0].name).toBe('Test Byg');
    expect(aborted).toContain('https://a.test/i');
  });

  it('parses contact details, keeping the first of several emails', async () => {
    stubFetch({ 'https://a.test/i': () => ok({ elements: [element] }), 'https://b.test/i': hangs });
    const { providers } = await fetchProviders(['carpentry'], 55.4, 8.4, 5, true, opts);
    expect(providers[0].email).toBe('first@test.dk');
    expect(providers[0].phone).toBe('+4512345678');
    expect(providers[0].website).toBeNull();
  });

  it('moves on straight away when a server fails fast', async () => {
    stubFetch({
      'https://a.test/i': () => Promise.resolve(new Response('busy', { status: 502 })),
      'https://b.test/i': () => ok({ elements: [element] }),
    });
    const { providers } = await fetchProviders(['carpentry'], 55.4, 8.4, 5, true, { ...opts, hedgeDelayMs: 5000 });
    expect(providers).toHaveLength(1);
  });

  it('does not trust an HTTP 200 that carries a runtime-error remark', async () => {
    stubFetch({
      'https://a.test/i': () => ok({ elements: [], remark: 'runtime error: Query timed out in "query" at line 3' }),
      'https://b.test/i': () => ok({ elements: [element] }),
    });
    const { providers } = await fetchProviders(['carpentry'], 55.4, 8.4, 5, true, opts);
    expect(providers).toHaveLength(1);
  });

  it('rejects when every server fails', async () => {
    stubFetch({
      'https://a.test/i': () => Promise.resolve(new Response('x', { status: 502 })),
      'https://b.test/i': () => Promise.resolve(new Response('x', { status: 429 })),
    });
    await expect(fetchProviders(['carpentry'], 55.4, 8.4, 5, true, opts)).rejects.toThrow();
  });

  it('gives up after the overall timeout', async () => {
    stubFetch({ 'https://a.test/i': hangs, 'https://b.test/i': hangs });
    await expect(
      fetchProviders(['carpentry'], 55.4, 8.4, 5, true, { ...opts, timeoutMs: 100 })
    ).rejects.toThrow(/timed out/i);
  });
});
