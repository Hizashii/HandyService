/**
 * Builders for the links behind the Call / Email / Website buttons. Provider contact details come from
 * open map data, so they can be messy (several numbers in one field, no scheme on a website, junk):
 * each builder returns null when the value cannot be turned into a safe link, and the UI then hides
 * the button.
 */

/** `tel:` link for the first phone number in the value, e.g. "+45 75 12 34 56; 75 98 76 54". */
export function phoneUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const first = phone.split(/[;,/]/)[0].trim();
  const digits = first.replace(/\D/g, '');
  if (digits.length < 5 || digits.length > 15) return null;
  return `tel:${first.startsWith('+') ? '+' : ''}${digits}`;
}

/** `mailto:` link for the first address in the value, with an optional subject line. */
export function emailUrl(email: string | null | undefined, subject?: string): string | null {
  if (!email) return null;
  const first = email.split(/[;,]/)[0].trim();
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(first)) return null;
  return `mailto:${first}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}

/** http(s) link for a website; adds https:// when the scheme is missing and rejects any other scheme. */
export function websiteUrl(site: string | null | undefined): string | null {
  const trimmed = site?.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}
