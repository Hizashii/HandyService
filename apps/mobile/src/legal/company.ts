/**
 * Who is behind the service. Every legal page reads from here, so a change (for example once the
 * company is registered and has a CVR number and an address) is made in one place.
 */
export const LEGAL = {
  brand: 'Håndmatch',
  operators: 'Lachezar Dimchov og Simon Nyblom',
  email: 'handmatchinfo@gmail.com',
  phone: '+45 42 31 95 28',
  website: 'https://haandmatch-web.pages.dev',
  /** Fill in when the company is registered; shown on the pages only when set. */
  cvr: null as string | null,
  address: null as string | null,
  /** Update when any of the legal texts change. */
  updated: '15. november 2026',
} as const;
