/**
 * Finds a business's public phone number and email on its own website. Only explicit, public contact
 * details are used: `mailto:` / `tel:` links first, then emails and clearly labelled phone numbers in
 * the page text. Nothing is guessed, so a missing value stays missing.
 */

export type SiteContacts = { phone: string | null; email: string | null }

/**
 * What a website lookup produced. `read` is true when the site was actually read (or told us to stay
 * away), so "nothing found" can be trusted and clear old values; false when it could not be reached,
 * in which case nothing should be concluded from the empty result.
 */
export type SiteLookup = SiteContacts & { read: boolean }

/** Biggest page we read. Contact info is near the top; this keeps one slow site from costing much. */
const MAX_BYTES = 400_000
const FETCH_TIMEOUT_MS = 6_000
const USER_AGENT = 'Haandmatch/0.1 (looking up public business contact details)'

/** Addresses that are page furniture or placeholders, never a business contact. */
const JUNK_EMAIL = /(@(example|domain|email|yourdomain|sentry|wixpress|godaddy|squarespace)\.|\.(png|jpe?g|gif|webp|svg|css|js)$|^(noreply|no-reply|donotreply)@)/i
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g

function cleanEmail(raw: string): string | null {
  let email = raw.trim();
  try {
    email = decodeURIComponent(email);
  } catch {
    // keep as-is
  }
  email = email.split(/[?;,\s]/)[0].toLowerCase();
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/.test(email) || email.length > 120) return null;
  return JUNK_EMAIL.test(email) ? null : email;
}

/**
 * Normalises a phone number to digits with an optional leading +. Eight-digit Danish numbers get +45.
 * Returns null for anything that is not plausibly a phone number.
 */
export function normalizePhone(raw: string): string | null {
  const first = raw.split(/[;,/]/)[0].trim();
  let digits = first.replace(/\D/g, '');
  const international = first.startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!international && digits.length === 8) return `+45${digits}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return international ? `+${digits}` : digits.length === 10 && digits.startsWith('45') ? `+${digits}` : null;
}

const attr = (html: string, scheme: string) =>
  [...html.matchAll(new RegExp(`href\\s*=\\s*["']${scheme}:([^"']+)["']`, 'gi'))].map((m) => m[1]);

/** Visible text: scripts, styles and tags removed, entities for @ restored. */
function visibleText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#0*64;|&commat;|\[at\]|\(at\)/gi, '@')
    .replace(/&nbsp;|&#160;/gi, ' ');
}

/** Pulls the best phone number and email out of a page's HTML. Pure, so it is easy to test. */
export function extractContacts(html: string): SiteContacts {
  let email: string | null = null;
  for (const raw of attr(html, 'mailto')) {
    email = cleanEmail(raw);
    if (email) break;
  }

  let phone: string | null = null;
  for (const raw of attr(html, 'tel')) {
    phone = normalizePhone(decodeURIComponent(raw));
    if (phone) break;
  }

  if (!email || !phone) {
    const text = visibleText(html);
    if (!email) {
      for (const match of text.matchAll(EMAIL)) {
        email = cleanEmail(match[0]);
        if (email) break;
      }
    }
    if (!phone) {
      // Only numbers that say what they are: "Tlf. 75 12 34 56", or an explicit +45 prefix. A bare run of
      // eight digits is as likely to be a CVR or order number, so it is ignored.
      const labelled = text.match(
        /(?:tlf|tel|telefon|telephone|phone|ring|mobil|kontakt)[.:\s]*((?:\+|00)?\s?(?:45)?[\s.-]?(?:\d[\s.-]?){8})/i
      );
      const international = text.match(/\+\s?45[\s.-]?(?:\d[\s.-]?){8}/);
      phone = normalizePhone(labelled?.[1] ?? international?.[0] ?? '');
    }
  }
  return { phone, email };
}

/** First link on the page that looks like a contact page, on the same site. */
export function findContactPage(html: string, base: URL): URL | null {
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>/gi)) {
    if (!/kontakt|contact|om-os|about/i.test(m[1])) continue;
    try {
      const url = new URL(m[1], base);
      if (url.hostname === base.hostname && /^https?:$/.test(url.protocol) && url.href !== base.href) return url;
    } catch {
      // not a usable link
    }
  }
  return null;
}

/** True for a public http(s) URL. Refuses localhost, internal names and private/loopback IPs. */
export function isPublicHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) {
    return false;
  }
  if (host.includes(':')) return false; // IPv6 literals
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10 || a === 127 || a === 0 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
  }
  return host.includes('.');
}

async function readText(res: Response): Promise<string> {
  if (!/text\/html|application\/xhtml/i.test(res.headers.get('content-type') ?? '')) return '';
  if (!res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  while (bytes < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }
  void reader.cancel().catch(() => {});
  return text;
}

const MAX_REDIRECTS = 4

/**
 * GET that follows redirects by hand, so every destination is checked BEFORE it is requested: it must
 * be a public http(s) URL, and, when `permit` is given, robots.txt must allow it. Returns the final
 * URL and response, null when a hop may not be fetched, or 'blocked' when `permit` refuses.
 */
async function safeGet(
  start: URL,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
  permit?: (url: URL) => Promise<boolean>
): Promise<{ res: Response; url: URL } | null | 'blocked'> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isPublicHttpUrl(url.href)) return null;
    if (permit && !(await permit(url))) return 'blocked';
    const res = await fetchImpl(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
    if (!location) return { res, url };
    void res.body?.cancel().catch(() => {});
    try {
      url = new URL(location, url);
    } catch {
      return null;
    }
  }
  return null;
}

/** The page's HTML and the URL it was finally served from, or `blocked` when robots.txt forbids it. */
async function fetchHtml(
  url: URL,
  fetchImpl: typeof fetch,
  permit: (url: URL) => Promise<boolean>
): Promise<{ html: string; url: URL; blocked: boolean }> {
  const got = await safeGet(url, { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' }, fetchImpl, permit);
  if (got === 'blocked') return { html: '', url, blocked: true };
  if (!got || !got.res.ok) return { html: '', url, blocked: false };
  return { html: await readText(got.res), url: got.url, blocked: false };
}

/** Our crawler's name as robots.txt files address it (the first part of the User-Agent). */
const ROBOTS_AGENT = 'haandmatch';
const MAX_ROBOTS_RULES = 1000;
const MAX_PATTERN_LENGTH = 300;

type RobotsRule = { allow: boolean; pattern: string };

/** The rules in a robots.txt that apply to us: our own group if there is one, otherwise the "*" group. */
function rulesFor(robots: string): RobotsRule[] {
  const groups: { agents: string[]; rules: RobotsRule[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (key === 'allow' || key === 'disallow') {
      lastWasAgent = false;
      // An empty Disallow means "nothing is disallowed", so it adds no rule.
      if (current && value !== '' && value.length <= MAX_PATTERN_LENGTH && current.rules.length < MAX_ROBOTS_RULES) {
        current.rules.push({ allow: key === 'allow', pattern: value });
      }
    }
  }
  const own = groups.filter((g) => g.agents.includes(ROBOTS_AGENT));
  return (own.length > 0 ? own : groups.filter((g) => g.agents.includes('*'))).flatMap((g) => g.rules);
}

/**
 * robots.txt pattern match: the pattern must match the start of the path, "*" matches any run of
 * characters and a trailing "$" pins the end. A small iterative matcher (not a regex) so a hostile
 * robots.txt cannot make it slow.
 */
function patternMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  const glob = anchored ? pattern.slice(0, -1) : pattern + '*';
  let g = 0;
  let p = 0;
  let starG = -1;
  let starP = 0;
  while (p < path.length) {
    if (g < glob.length && glob[g] === '*') {
      starG = g++;
      starP = p;
    } else if (g < glob.length && glob[g] === path[p]) {
      g++;
      p++;
    } else if (starG >= 0) {
      g = starG + 1;
      p = ++starP;
    } else {
      return false;
    }
  }
  while (g < glob.length && glob[g] === '*') g++;
  return g === glob.length;
}

/**
 * Whether robots.txt lets us fetch `path` (path plus query). The longest matching rule wins, and
 * Allow wins a tie, as in the robots.txt standard. No matching rule means allowed.
 */
export function robotsAllows(robots: string, path: string): boolean {
  let best: RobotsRule | null = null;
  for (const rule of rulesFor(robots)) {
    if (!patternMatches(rule.pattern, path)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) {
      best = rule;
    }
  }
  return best ? best.allow : true;
}

/** Whether robots.txt keeps us out of the whole site (its front page is off limits). */
export function robotsBlocksAll(robots: string): boolean {
  return !robotsAllows(robots, '/');
}

/**
 * robots.txt text for a site: '' when it has none (a 4xx answer), or null when it cannot be relied on
 * (network error or a 5xx answer), in which case the site is left alone.
 */
async function loadRobots(site: URL, fetchImpl: typeof fetch): Promise<string | null> {
  try {
    const got = await safeGet(new URL('/robots.txt', site), { 'user-agent': USER_AGENT }, fetchImpl);
    if (!got || got === 'blocked' || got.res.status >= 500) return null;
    if (!got.res.ok) return '';
    return (await got.res.text()).slice(0, 500_000);
  } catch {
    return null;
  }
}

/**
 * Looks at a provider's homepage, and one contact page if the homepage did not have both details.
 * Every page is checked against that site's robots.txt first, path rules included. Never throws:
 * any problem just means "nothing found".
 */
export async function fetchSiteContacts(website: string, fetchImpl: typeof fetch = fetch): Promise<SiteLookup> {
  const unreachable: SiteLookup = { phone: null, email: null, read: false };
  try {
    if (!isPublicHttpUrl(website)) return unreachable;
    const start = new URL(website);

    // One robots.txt per site (a redirect can lead to another host with its own rules).
    const robotsBySite = new Map<string, string | null>();
    let robotsUnavailable = false;
    const permit = async (url: URL): Promise<boolean> => {
      let robots = robotsBySite.get(url.origin);
      if (robots === undefined) {
        robots = await loadRobots(url, fetchImpl);
        robotsBySite.set(url.origin, robots);
      }
      if (robots === null) {
        robotsUnavailable = true;
        return false;
      }
      return robotsAllows(robots, url.pathname + url.search);
    };

    const home = await fetchHtml(start, fetchImpl, permit);
    if (home.blocked) {
      // Could not read the rules: conclude nothing. The site says no: nothing may be read or kept.
      return robotsUnavailable ? unreachable : { phone: null, email: null, read: true };
    }
    if (!home.html) return unreachable;
    let found = extractContacts(home.html);
    if (!found.phone || !found.email) {
      // Resolve links against where the homepage really lives (it may redirect to www. or a subfolder).
      const contactPage = findContactPage(home.html, home.url);
      if (contactPage) {
        try {
          // A contact page robots.txt forbids is simply skipped; the homepage's details stay.
          const more = extractContacts((await fetchHtml(contactPage, fetchImpl, permit)).html);
          found = { phone: found.phone ?? more.phone, email: found.email ?? more.email };
        } catch {
          // The optional contact page failed: keep what the homepage gave us.
        }
      }
    }
    return { ...found, read: true };
  } catch {
    return unreachable;
  }
}
