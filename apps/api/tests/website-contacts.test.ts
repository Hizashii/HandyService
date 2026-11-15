import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  extractContacts,
  fetchSiteContacts,
  findContactPage,
  isPublicHttpUrl,
  normalizePhone,
  robotsAllows,
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
    expect(extractContacts('<html><body>Hello</body></html>')).toMatchObject({ phone: null, email: null })
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
    expect(await fetchSiteContacts('https://byg.dk/', f)).toMatchObject({ phone: '+4575123456', email: 'a@byg.dk' })
  })

  it('follows one contact page for what the homepage lacks', async () => {
    const f = stub({
      '/': () => html('<a href="/kontakt">Kontakt</a><a href="mailto:a@byg.dk">y</a>'),
      '/kontakt': () => html('<p>Telefon: 75 12 34 56</p>'),
    })
    expect(await fetchSiteContacts('https://byg.dk/', f)).toMatchObject({ phone: '+4575123456', email: 'a@byg.dk' })
  })

  it('respects a robots.txt that blocks everything', async () => {
    const f = stub({
      '/robots.txt': () => new Response('User-agent: *\nDisallow: /'),
      '/': () => html('<a href="mailto:a@byg.dk">y</a>'),
    })
    expect(await fetchSiteContacts('https://byg.dk/', f)).toMatchObject({ phone: null, email: null })
  })

  it('never fetches private addresses', async () => {
    const spy = vi.fn()
    expect(await fetchSiteContacts('http://169.254.169.254/', spy as unknown as typeof fetch)).toEqual({
      phone: null,
      email: null,
      read: false,
    })
    expect(spy).not.toHaveBeenCalled()
  })

  it('ignores non-HTML responses and survives network errors', async () => {
    const pdf = stub({ '/': () => new Response('a@b.dk', { headers: { 'content-type': 'application/pdf' } }) })
    expect(await fetchSiteContacts('https://byg.dk/', pdf)).toMatchObject({ phone: null, email: null })
    const boom = (() => Promise.reject(new Error('network'))) as typeof fetch
    expect(await fetchSiteContacts('https://byg.dk/', boom)).toMatchObject({ phone: null, email: null })
  })
})

describe('fetchSiteContacts redirects and failures', () => {
  const html = (body: string) => new Response(body, { status: 200, headers: { 'content-type': 'text/html' } })
  const redirect = (to: string) => new Response(null, { status: 301, headers: { location: to } })

  it('never requests a private address a public site redirects to', async () => {
    const seen: string[] = []
    const f = ((input: RequestInfo | URL) => {
      seen.push(String(input))
      return Promise.resolve(redirect('http://169.254.169.254/latest/meta-data'))
    }) as typeof fetch
    expect(await fetchSiteContacts('https://evil.dk/', f)).toMatchObject({ phone: null, email: null })
    expect(seen.some((u) => u.includes('169.254'))).toBe(false)
  })

  it('stops after too many redirects', async () => {
    const f = (() => Promise.resolve(redirect('https://loop.dk/'))) as typeof fetch
    expect(await fetchSiteContacts('https://loop.dk/', f)).toMatchObject({ phone: null, email: null })
  })

  it('resolves the contact link against the redirected homepage', async () => {
    const f = ((input: RequestInfo | URL) => {
      const u = new URL(String(input))
      if (u.href === 'https://byg.dk/') return Promise.resolve(redirect('https://www.byg.dk/'))
      if (u.href === 'https://www.byg.dk/') return Promise.resolve(html('<a href="https://www.byg.dk/kontakt">k</a>'))
      if (u.pathname === '/kontakt') return Promise.resolve(html('<a href="mailto:a@byg.dk">m</a>'))
      return Promise.resolve(new Response('', { status: 404 }))
    }) as typeof fetch
    expect((await fetchSiteContacts('https://byg.dk/', f)).email).toBe('a@byg.dk')
  })

  it('keeps homepage details when the contact page fails', async () => {
    const f = ((input: RequestInfo | URL) => {
      const u = new URL(String(input))
      if (u.pathname === '/') return Promise.resolve(html('<a href="/kontakt">k</a><a href="mailto:a@byg.dk">m</a>'))
      if (u.pathname === '/kontakt') return Promise.reject(new Error('timeout'))
      return Promise.resolve(new Response('', { status: 404 }))
    }) as typeof fetch
    expect(await fetchSiteContacts('https://byg.dk/', f)).toMatchObject({ phone: null, email: 'a@byg.dk' })
  })
})

describe('fetchSiteContacts read flag', () => {
  const html = (body: string) => new Response(body, { status: 200, headers: { 'content-type': 'text/html' } })

  it('marks a successful read with nothing found as read, so old contacts can be cleared', async () => {
    const f = (() => Promise.resolve(html('<p>No details here</p>'))) as typeof fetch
    expect(await fetchSiteContacts('https://byg.dk/', f)).toEqual({ phone: null, email: null, read: true })
  })

  it('marks an unreachable site as not read, so nothing is concluded from it', async () => {
    const down = (() => Promise.reject(new Error('network'))) as typeof fetch
    expect((await fetchSiteContacts('https://byg.dk/', down)).read).toBe(false)
    const err500 = (() => Promise.resolve(new Response('x', { status: 500 }))) as typeof fetch
    expect((await fetchSiteContacts('https://byg.dk/', err500)).read).toBe(false)
  })

  it('treats a robots.txt block as read, so stored contacts are dropped', async () => {
    const f = ((input: RequestInfo | URL) =>
      Promise.resolve(
        new URL(String(input)).pathname === '/robots.txt' ? new Response('User-agent: *\nDisallow: /') : html('x')
      )) as typeof fetch
    expect(await fetchSiteContacts('https://byg.dk/', f)).toEqual({ phone: null, email: null, read: true })
  })
})

describe('robotsAllows (path rules)', () => {
  it('blocks only the disallowed path and what is under it', () => {
    const r = 'User-agent: *\nDisallow: /kontakt';
    expect(robotsAllows(r, '/kontakt')).toBe(false);
    expect(robotsAllows(r, '/kontakt/os')).toBe(false);
    expect(robotsAllows(r, '/')).toBe(true);
    expect(robotsAllows(r, '/om')).toBe(true);
  });

  it('lets a longer Allow override a shorter Disallow, and Allow win a tie', () => {
    const r = 'User-agent: *\nDisallow: /privat\nAllow: /privat/offentlig';
    expect(robotsAllows(r, '/privat/offentlig/side')).toBe(true);
    expect(robotsAllows(r, '/privat/andet')).toBe(false);
    expect(robotsAllows('User-agent: *\nDisallow: /a\nAllow: /a', '/a')).toBe(true);
  });

  it('supports * wildcards and a trailing $', () => {
    const r = 'User-agent: *\nDisallow: /*.pdf$\nDisallow: /soeg?*';
    expect(robotsAllows(r, '/fil.pdf')).toBe(false);
    expect(robotsAllows(r, '/fil.pdf?x=1')).toBe(true);
    expect(robotsAllows(r, '/soeg?q=1')).toBe(false);
    expect(robotsAllows(r, '/soeg')).toBe(true);
  });

  it('prefers a group naming us over the * group', () => {
    const r = 'User-agent: *\nDisallow: /\n\nUser-agent: Haandmatch\nDisallow: /hemmelig';
    expect(robotsAllows(r, '/')).toBe(true);
    expect(robotsAllows(r, '/hemmelig')).toBe(false);
  });

  it('treats an empty Disallow as allow-all and shares a group between consecutive agents', () => {
    expect(robotsAllows('User-agent: *\nDisallow:', '/kontakt')).toBe(true);
    expect(robotsAllows('User-agent: googlebot\nUser-agent: *\nDisallow: /x', '/x')).toBe(false);
  });

  it('stays fast on a hostile pattern', () => {
    const r = 'User-agent: *\nDisallow: /*a*a*a*a*a*a*a*a*a*a*b';
    const started = Date.now();
    expect(robotsAllows(r, '/' + 'a'.repeat(250))).toBe(true);
    expect(Date.now() - started).toBeLessThan(500);
  });
});

describe('fetchSiteContacts and robots.txt paths', () => {
  const html = (body: string) => new Response(body, { status: 200, headers: { 'content-type': 'text/html' } });
  const robots = (text: string) => new Response(text, { status: 200, headers: { 'content-type': 'text/plain' } });

  function tracked(handler: (u: URL) => Response | Promise<Response>) {
    const requested: string[] = [];
    const f = ((input: RequestInfo | URL) => {
      const u = new URL(String(input));
      requested.push(u.href);
      return Promise.resolve(handler(u));
    }) as typeof fetch;
    return { f, requested };
  }

  it('does not read a contact page that robots.txt disallows, but keeps the homepage details', () => {
    const { f, requested } = tracked((u) => {
      if (u.pathname === '/robots.txt') return robots('User-agent: *\nDisallow: /kontakt');
      if (u.pathname === '/') return html('<a href="/kontakt">k</a><a href="tel:75123456">t</a>');
      return html('<a href="mailto:hemmelig@byg.dk">m</a>');
    });
    return fetchSiteContacts('https://byg.dk/', f).then((r) => {
      expect(requested.some((u) => u.endsWith('/kontakt'))).toBe(false);
      expect(r).toEqual({ phone: '+4575123456', email: null, read: true });
    });
  });

  it('reads a contact page that robots.txt does not mention', () => {
    const { f } = tracked((u) => {
      if (u.pathname === '/robots.txt') return robots('User-agent: *\nDisallow: /admin');
      if (u.pathname === '/') return html('<a href="/kontakt">k</a>');
      return html('<a href="mailto:a@byg.dk">m</a>');
    });
    return fetchSiteContacts('https://byg.dk/', f).then((r) => expect(r.email).toBe('a@byg.dk'));
  });

  it('never fetches the homepage when robots.txt disallows it, and counts that as read', () => {
    const { f, requested } = tracked((u) =>
      u.pathname === '/robots.txt' ? robots('User-agent: *\nDisallow: /') : html('<a href="mailto:a@byg.dk">m</a>')
    );
    return fetchSiteContacts('https://byg.dk/', f).then((r) => {
      expect(requested).toEqual(['https://byg.dk/robots.txt']);
      expect(r).toEqual({ phone: null, email: null, read: true });
    });
  });

  it('leaves the site alone, concluding nothing, when robots.txt cannot be fetched (5xx)', () => {
    const { f, requested } = tracked((u) =>
      u.pathname === '/robots.txt' ? new Response('x', { status: 503 }) : html('<a href="mailto:a@byg.dk">m</a>')
    );
    return fetchSiteContacts('https://byg.dk/', f).then((r) => {
      expect(requested).toEqual(['https://byg.dk/robots.txt']);
      expect(r.read).toBe(false);
    });
  });

  it('checks the redirected host against its own robots.txt before reading it', () => {
    const redirect = new Response(null, { status: 301, headers: { location: 'https://www.byg.dk/' } });
    const { f, requested } = tracked((u) => {
      if (u.href === 'https://byg.dk/robots.txt') return robots('');
      if (u.href === 'https://byg.dk/') return redirect;
      if (u.href === 'https://www.byg.dk/robots.txt') return robots('User-agent: *\nDisallow: /');
      return html('<a href="mailto:a@byg.dk">m</a>');
    });
    return fetchSiteContacts('https://byg.dk/', f).then((r) => {
      expect(requested).not.toContain('https://www.byg.dk/');
      expect(r).toEqual({ phone: null, email: null, read: true });
    });
  });
});
