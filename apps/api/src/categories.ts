export const CATEGORY_IDS = [
  'carpentry',
  'cleaning',
  'window-cleaning',
  'plumbing',
  'electrical',
  'painting',
  'gardening',
  'moving',
  'repairs',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

/**
 * How each category is recognised in OpenStreetMap data.
 * `tags`: exact tag values (key -> allowed values). `name`: case-insensitive
 * regex on the name, used where OSM has no good tag (mostly Danish keywords).
 */
type Rule = { tags?: Record<string, string[]>; name?: string };

export const CATEGORY_RULES: Record<CategoryId, Rule> = {
  carpentry: { tags: { craft: ['carpenter', 'joiner'] } },
  cleaning: { tags: { craft: ['cleaning'], office: ['cleaning'] }, name: 'rengøring|rengoring' },
  'window-cleaning': { name: 'vinduespuds|vinduespolering|vinduesvask' },
  plumbing: { tags: { craft: ['plumber'] } },
  electrical: { tags: { craft: ['electrician'] } },
  painting: { tags: { craft: ['painter'] } },
  gardening: { tags: { craft: ['gardener'] } },
  moving: { tags: { office: ['moving_company'] }, name: 'flytte|flytning' },
  repairs: { tags: { craft: ['handyman', 'roofer', 'locksmith', 'tiler', 'plasterer', 'builder'] } },
};

export function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

/** Categories an OSM element belongs to, based on its tags. */
export function categoriesForTags(tags: Record<string, string>): CategoryId[] {
  const name = tags.name ?? '';
  return CATEGORY_IDS.filter((id) => {
    const rule = CATEGORY_RULES[id];
    const byTag = Object.entries(rule.tags ?? {}).some(([key, values]) =>
      // OSM allows "a;b" multi-values.
      (tags[key] ?? '').split(';').some((v) => values.includes(v.trim()))
    );
    const byName = rule.name ? new RegExp(rule.name, 'i').test(name) : false;
    return byTag || byName;
  });
}

/** Overpass QL statements selecting the given categories around a point. */
export function overpassStatements(
  categories: readonly CategoryId[],
  radiusMeters: number,
  lat: number,
  lng: number,
  /**
   * Include the name-regex rules. They are far slower than tag lookups, so broad "all categories"
   * searches skip them; they run when the user picks a specific category.
   */
  includeNameRules = true
): string[] {
  const around = `(around:${radiusMeters},${lat},${lng})`;
  const statements: string[] = [];
  for (const id of categories) {
    const rule = CATEGORY_RULES[id];
    for (const [key, values] of Object.entries(rule.tags ?? {})) {
      // OSM allows several values in one tag ("carpenter;joiner"), so match each ;-separated value.
      statements.push(`nwr["${key}"~"(^|;) ?(${values.join('|')}) ?(;|$)"]${around};`);
    }
    if (rule.name && includeNameRules) {
      // A bare name regex scans every named object in the area, which is very slow in cities.
      // Requiring a business-type key lets Overpass start from a much smaller indexed set.
      for (const key of ['office', 'craft', 'shop']) {
        statements.push(`nwr["${key}"]["name"~"${rule.name}",i]${around};`)
      }
    };
  }
  return statements;
}
