export type CategoryId =
  | 'carpentry'
  | 'cleaning'
  | 'window-cleaning'
  | 'plumbing'
  | 'electrical'
  | 'painting'
  | 'gardening'
  | 'moving'
  | 'repairs';

/** A rating collected from one external source (Google, Trustpilot, ...). */
export type SourceRating = {
  source: string;
  rating: number; // 0-5
  reviewCount: number;
  url?: string;
};

export type Provider = {
  id: string;
  name: string;
  categories: CategoryId[];
  description: string;
  city: string;
  distanceKm: number;
  /** 1 = budget, 2 = mid, 3 = premium. Currency-neutral on purpose. */
  priceLevel: 1 | 2 | 3;
  /** Free-text price info as found when scraping, if any. */
  priceNote?: string;
  phone?: string;
  website?: string;
  ratings: SourceRating[];
};
