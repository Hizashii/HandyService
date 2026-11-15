import { describe, expect, it } from 'vitest';

import { categoriesForTags, overpassStatements } from '../src/categories';
import { boundingBox, haversineKm, snapToCell } from '../src/geo';

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
