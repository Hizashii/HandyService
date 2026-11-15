/**
 * Finds a business's public phone number and email on its own website. Only explicit, public contact
 * details are used: `mailto:` / `tel:` links first, then emails and clearly labelled phone numbers in
 * the page text. Nothing is guessed, so a missing value stays missing.
 */

export type SiteContacts = { phone: string | null; email: string | null }

/** Biggest page we read. Contact info is near the top; this keeps one slow site from costing much. */
const MAX_BYTES = 400_000
const FETCH_TIMEOUT_MS = 6_000
const USER_AGENT = 'HandyService/0.1 (looking up public business contact details)'

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

async function fetchHtml(url: URL, fetchImpl: typeof fetch): Promise<string> {
  const res = await fetchImpl(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  // A redirect must not lead somewhere private or off to a non-web scheme.
  if (!res.ok || !isPublicHttpUrl(res.url || url.href)) return '';
  return readText(res);
}

/** Whether the site's robots.txt asks all robots to stay out of the whole site. */
export function robotsBlocksAll(robots: string): boolean {
  let applies = false;
  for (const line of robots.split(/\r?\n/)) {
    const [field, ...rest] = line.split('#')[0].split(':');
    const key = field.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') applies = value === '*';
    else if (applies && key === 'disallow' && value === '/') return true;
  }
  return false;
}

/**
 * Looks at a provider's homepage, and one contact page if the homepage did not have both details.
 * Never throws: any problem just means "nothing found".
 */
export async function fetchSiteContacts(website: string, fetchImpl: typeof fetch = fetch): Promise<SiteContacts> {
  const none: SiteContacts = { phone: null, email: null };
  try {
    if (!isPublicHttpUrl(website)) return none;
    const home = new URL(website);

    const robots = await fetchImpl(new URL('/robots.txt', home), {
      headers: { 'user-agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
      .then((r) => (r.ok ? r.text() : ''))
      .catch(() => '');
    if (robotsBlocksAll(robots)) return none;

    const homeHtml = await fetchHtml(home, fetchImpl);
    let found = extractContacts(homeHtml);
    if (!found.phone || !found.email) {
      const contactPage = findContactPage(homeHtml, home);
      if (contactPage) {
        const more = extractContacts(await fetchHtml(contactPage, fetchImpl));
        found = { phone: found.phone ?? more.phone, email: found.email ?? more.email };
      }
    }
    return found;
  } catch {
    return none;
  }
}
