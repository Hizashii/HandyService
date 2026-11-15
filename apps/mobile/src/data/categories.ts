import type { CategoryId, SourceRating } from './types';

export const categories: { id: CategoryId; label: string }[] = [
  { id: 'carpentry', label: 'Carpentry' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'window-cleaning', label: 'Windows' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'painting', label: 'Painting' },
  { id: 'gardening', label: 'Gardening' },
  { id: 'moving', label: 'Moving' },
  { id: 'repairs', label: 'Repairs' },
];

export const getCategory = (id: CategoryId) => categories.find((c) => c.id === id);

/** Review-count weighted average across all sources. */
export function overallRating(ratings: SourceRating[]) {
  const total = ratings.reduce((n, r) => n + r.reviewCount, 0);
  if (total === 0) return { rating: 0, reviewCount: 0 };
  const sum = ratings.reduce((n, r) => n + r.rating * r.reviewCount, 0);
  return { rating: sum / total, reviewCount: total };
}
