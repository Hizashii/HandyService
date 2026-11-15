import type { CategoryId, SourceRating } from './types';

export const categories: { id: CategoryId; label: string }[] = [
  { id: 'carpentry', label: 'Tømrer & montering' },
  { id: 'cleaning', label: 'Rengøring' },
  { id: 'window-cleaning', label: 'Vinduespudsning' },
  { id: 'plumbing', label: 'VVS' },
  { id: 'electrical', label: 'El & installation' },
  { id: 'painting', label: 'Malerarbejde' },
  { id: 'gardening', label: 'Have & udendørs' },
  { id: 'moving', label: 'Flytning' },
  { id: 'repairs', label: 'Håndværk & reparation' },
];

export const getCategory = (id: CategoryId) => categories.find((c) => c.id === id);

/** Review-count weighted average across all sources. */
export function overallRating(ratings: SourceRating[]) {
  const total = ratings.reduce((n, r) => n + r.reviewCount, 0);
  if (total === 0) return { rating: 0, reviewCount: 0 };
  const sum = ratings.reduce((n, r) => n + r.rating * r.reviewCount, 0);
  return { rating: sum / total, reviewCount: total };
}
