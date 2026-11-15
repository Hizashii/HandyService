import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  extractContacts,
  fetchSiteContacts,
  findContactPage,
  isPublicHttpUrl,
  normalizePhone,
  robotsBlocksAll,
} from '../src/sources/website-contacts'

describe('normalizePhone', () => {
  it('adds +45 to bare Danish numbers and strips formatting', () => {
    expect(normalizePhone('75 12 34 56')).toBe('+4575123456')
    expect(normalizePhone('7512-3456')).toBe('+4575123456')
  })
  it('keeps international numbers, including 00 prefixes', () => {
    expect(normalizePhone('+45 75 12 34 56')).toBe('+4575123456')
    expect(normalizePhone('0045 75123456')).toBe('+4575123456')
    expect(normalizePhone('+49 30 123456')).toBe('+4930123456')
  })
  it('uses only the first number and rejects junk', () => {
    expect(normalizePhone('75123456 / 75987654')).toBe('+4575123456')
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone('12345')).toBeNull()
    expect(normalizePhone('1'.repeat(20))).toBeNull()
  })
})

describe('extractContacts', () => {
  it('prefers mailto: and tel: links', () => {
    const html = '<a href="mailto:info@byg.dk?subject=Hej">Mail</a><a href="tel:+4575123456">Ring</a>'
    expect(extractContacts(html)).toEqual({ phone: '+4575123456', email: 'info@byg.dk' })
  })
  it('falls back to labelled phone numbers and emails in the text', () => {
    const html = '<p>Tlf. 75 12 34 56</p><p>Skriv til kontakt@maler.dk</p>'
    expect(extractContacts(html)).toEqual({ phone: '+4575123456', email: 'kontakt@maler.dk' })
  })
  it('does not treat unlabelled digit runs as phone numbers', () => {
    expect(extractContacts('<p>CVR 12345678</p>').phone).toBeNull()
  })
  it('ignores scripts, placeholder and image addresses', () => {
    const html =
      '<script>var a="hidden@real.dk"</script><p>you@example.com logo@2x.png noreply@firma.dk</p><p>ok@firma.dk</p>'
    expect(extractContacts(html).email).toBe('ok@firma.dk')
  })
  it('reads obfuscated @ signs', () => {
    expect(extractContacts('<p>info [at] vvs.dk</p>').email).toBeNull() // spaces break it: not guessed
    expect(extractContacts('<p>info&#64;vvs.dk</p>').email).toBe('info@vvs.dk')
  })
  it('returns nulls for a page with nothing', () => {
    expect(extractContacts('<html><body>Hello</body></html>')).toEqual({ phone: null, email: null })
  })
})

describe('findContactPage', () => {
  const base = new URL('https://byg.dk/')
  it('finds a same-site contact link, resolving relative urls', () => {
    expect(findContactPage('<a href="/kontakt">Kontakt</a>', base)?.href).toBe('https://byg.dk/kontakt')
  })
  it('ignores links to other sites', () => {
    expect(findContactPage('<a href="https://other.dk/contact">x</a>', base)).toBeNull()
  })
})

describe('isPublicHttpUrl', () => {
  it('accepts normal sites', () => {
    expect(isPublicHttpUrl('https://www.byg.dk/kontakt')).toBe(true)
  })
  it('rejects non-web schemes, localhost and private addresses', () => {
    for (const u of [
      'file:///etc/passwd',
      'javascript:alert(1)',
      'http://localhost:8787',
      'http://127.0.0.1',
      'http://10.0.0.5',
      'http://192.168.1.1',
      'http://172.20.0.1',
      'http://169.254.169.254/latest',
      'http://[::1]/',
      'http://intranet',
      'not a url',
    ]) {
      expect(isPublicHttpUrl(u), u).toBe(false)
    }
  })
})

describe('robotsBlocksAll', () => {
  it('blocks only when all robots are disallowed from the whole site', () => {
    expect(robotsBlocksAll('User-agent: *\nDisallow: /')).toBe(true)
    expect(robotsBlocksAll('User-agent: *\nDisallow: /admin')).toBe(false)
    expect(robotsBlocksAll('User-agent: BadBot\nDisallow: /')).toBe(false)
    expect(robotsBlocksAll('')).toBe(false)
  })
})

describe('fetchSiteContacts', () => {
  afterEach(() => vi.unstubAllGlobals())

  const html = (body: string) =>
    new Response(body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
  const stub = (pages: Record<string, () => Response>) =>
    ((input: RequestInfo | URL) => {
      const make = pages[new URL(String(input)).pathname]
      return Promise.resolve(make ? make() : new Response('nope', { status: 404 }))
    }) as typeof fetch

  it('reads the homepage', async () => {
    const f = stub({ '/': () => html('<a href="tel:75123456">x</a><a href="mailto:a@byg.dk">y</a>') })
    expect(await fetchSiteContacts('https://byg.dk/', f)).toEqual({ phone: '+4575123456', email: 'a@byg.dk' })
  })

  it('follows one contact page for what the homepage lacks', async () => {
    const f = stub({
      '/': () => html('<a href="/kontakt">Kontakt</a><a href="mailto:a@byg.dk">y</a>'),
      '/kontakt': () => html('<p>Telefon: 75 12 34 56</p>'),
    })
    expect(await fetchSiteContacts('https://byg.dk/', f)).toEqual({ phone: '+4575123456', email: 'a@byg.dk' })
  })

  it('respects a robots.txt that blocks everything', async () => {
    const f = stub({
      '/robots.txt': () => new Response('User-agent: *\nDisallow: /'),
      '/': () => html('<a href="mailto:a@byg.dk">y</a>'),
    })
    expect(await fetchSiteContacts('https://byg.dk/', f)).toEqual({ phone: null, email: null })
  })

  it('never fetches private addresses', async () => {
    const spy = vi.fn()
    expect(await fetchSiteContacts('http://169.254.169.254/', spy as unknown as typeof fetch)).toEqual({
      phone: null,
      email: null,
    })
    expect(spy).not.toHaveBeenCalled()
  })

  it('ignores non-HTML responses and survives network errors', async () => {
    const pdf = stub({ '/': () => new Response('a@b.dk', { headers: { 'content-type': 'application/pdf' } }) })
    expect(await fetchSiteContacts('https://byg.dk/', pdf)).toEqual({ phone: null, email: null })
    const boom = (() => Promise.reject(new Error('network'))) as typeof fetch
    expect(await fetchSiteContacts('https://byg.dk/', boom)).toEqual({ phone: null, email: null })
  })
})
