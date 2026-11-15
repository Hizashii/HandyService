import { describe, expect, it } from 'vitest';

import { emailUrl, phoneUrl, websiteUrl } from './contact';

describe('phoneUrl', () => {
  it('cleans formatting and keeps a leading +', () => {
    expect(phoneUrl('+45 75 12 34 56')).toBe('tel:+4575123456');
    expect(phoneUrl('+45 7512-3456')).toBe('tel:+4575123456');
    expect(phoneUrl('75 12 34 56')).toBe('tel:75123456');
  });

  it('uses only the first number when several are listed', () => {
    expect(phoneUrl('+4575123456; +4575987654')).toBe('tel:+4575123456');
    expect(phoneUrl('75123456 / 75987654')).toBe('tel:75123456');
  });

  it('rejects empty, too short and non-numeric values', () => {
    expect(phoneUrl(null)).toBeNull();
    expect(phoneUrl('')).toBeNull();
    expect(phoneUrl('112')).toBeNull();
    expect(phoneUrl('call us')).toBeNull();
    expect(phoneUrl('1'.repeat(20))).toBeNull();
  });
});

describe('emailUrl', () => {
  it('builds a mailto link, with an optional encoded subject', () => {
    expect(emailUrl('info@byg.dk')).toBe('mailto:info@byg.dk');
    expect(emailUrl('info@byg.dk', 'Quote request & timing')).toBe(
      'mailto:info@byg.dk?subject=Quote%20request%20%26%20timing',
    );
  });

  it('uses only the first address', () => {
    expect(emailUrl('a@x.dk; b@x.dk')).toBe('mailto:a@x.dk');
  });

  it('rejects things that are not an email address', () => {
    expect(emailUrl(undefined)).toBeNull();
    expect(emailUrl('not an email')).toBeNull();
    expect(emailUrl('a@b')).toBeNull();
    expect(emailUrl('"x"<a@b.dk>')).toBeNull();
  });
});

describe('websiteUrl', () => {
  it('adds https when the scheme is missing', () => {
    expect(websiteUrl('www.byg.dk')).toBe('https://www.byg.dk/');
    expect(websiteUrl('  byg.dk/kontakt ')).toBe('https://byg.dk/kontakt');
  });

  it('keeps http and https links', () => {
    expect(websiteUrl('http://byg.dk')).toBe('http://byg.dk/');
    expect(websiteUrl('https://byg.dk/a?b=1')).toBe('https://byg.dk/a?b=1');
  });

  it('rejects other schemes and junk', () => {
    expect(websiteUrl('javascript:alert(1)')).toBeNull();
    expect(websiteUrl('file:///etc/passwd')).toBeNull();
    expect(websiteUrl('tel:+4512345678')).toBeNull();
    expect(websiteUrl('')).toBeNull();
    expect(websiteUrl(null)).toBeNull();
  });
});
