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
  url: string | null;
};

/** Mirrors the API's provider shape (apps/api/src/db.ts). */
export type Provider = {
  id: string;
  source: string;
  name: string;
  categories: CategoryId[];
  lat: number;
  lng: number;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  ratings: SourceRating[];
  /** Straight-line distance from the user's location, when known. */
  distanceKm?: number;
};

export type Coords = { lat: number; lng: number };

export type Place = Coords & { name: string; label?: string };
