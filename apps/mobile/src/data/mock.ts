import type { CategoryId, Provider, SourceRating } from './types';

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

export const providers: Provider[] = [
  {
    id: 'p1',
    name: 'Nordic Carpentry Co.',
    categories: ['carpentry', 'repairs'],
    description: 'Custom furniture, decks, doors and general woodwork for homes and public buildings.',
    city: 'Copenhagen',
    distanceKm: 2.4,
    priceLevel: 2,
    priceNote: 'From 450/h',
    phone: '+4512345678',
    website: 'https://example.com',
    ratings: [
      { source: 'Google', rating: 4.8, reviewCount: 212 },
      { source: 'Trustpilot', rating: 4.6, reviewCount: 64 },
    ],
  },
  {
    id: 'p2',
    name: 'SparkleClean',
    categories: ['cleaning', 'window-cleaning'],
    description: 'Home, office and municipal cleaning. Window cleaning up to 4 floors.',
    city: 'Copenhagen',
    distanceKm: 1.1,
    priceLevel: 1,
    priceNote: 'From 290/h',
    phone: '+4511223344',
    website: 'https://example.com',
    ratings: [
      { source: 'Google', rating: 4.5, reviewCount: 540 },
      { source: 'Trustpilot', rating: 4.3, reviewCount: 188 },
    ],
  },
  {
    id: 'p3',
    name: 'ClearView Windows',
    categories: ['window-cleaning'],
    description: 'Specialists in window and facade cleaning with water-fed pole systems.',
    city: 'Frederiksberg',
    distanceKm: 3.7,
    priceLevel: 2,
    priceNote: 'Fixed price per window',
    website: 'https://example.com',
    ratings: [{ source: 'Google', rating: 4.9, reviewCount: 97 }],
  },
  {
    id: 'p4',
    name: 'FixIt Plumbing',
    categories: ['plumbing', 'repairs'],
    description: '24/7 emergency plumbing, bathroom renovation and leak repair.',
    city: 'Copenhagen',
    distanceKm: 4.2,
    priceLevel: 3,
    priceNote: 'Call-out fee + 650/h',
    phone: '+4599887766',
    ratings: [
      { source: 'Google', rating: 4.2, reviewCount: 305 },
      { source: 'Trustpilot', rating: 3.9, reviewCount: 120 },
    ],
  },
  {
    id: 'p5',
    name: 'Bright Electric',
    categories: ['electrical'],
    description: 'Certified electricians for installations, fuse boxes and EV chargers.',
    city: 'Amager',
    distanceKm: 5.8,
    priceLevel: 2,
    priceNote: 'From 520/h',
    phone: '+4570707070',
    website: 'https://example.com',
    ratings: [
      { source: 'Google', rating: 4.7, reviewCount: 158 },
      { source: 'Trustpilot', rating: 4.8, reviewCount: 41 },
    ],
  },
  {
    id: 'p6',
    name: 'Colour & Co. Painters',
    categories: ['painting'],
    description: 'Interior and exterior painting, wallpapering and wood treatment.',
    city: 'Frederiksberg',
    distanceKm: 3.1,
    priceLevel: 1,
    priceNote: 'From 340/h',
    ratings: [{ source: 'Google', rating: 4.4, reviewCount: 76 }],
  },
  {
    id: 'p7',
    name: 'GreenThumb Gardens',
    categories: ['gardening'],
    description: 'Lawn care, hedge trimming and seasonal garden maintenance, including public parks.',
    city: 'Gentofte',
    distanceKm: 8.9,
    priceLevel: 1,
    priceNote: 'From 310/h',
    website: 'https://example.com',
    ratings: [
      { source: 'Google', rating: 4.6, reviewCount: 130 },
      { source: 'Trustpilot', rating: 4.5, reviewCount: 52 },
    ],
  },
  {
    id: 'p8',
    name: 'MoveMate',
    categories: ['moving'],
    description: 'Apartment and office moves with packing service and furniture assembly.',
    city: 'Copenhagen',
    distanceKm: 2.0,
    priceLevel: 2,
    priceNote: 'From 790/h incl. truck',
    phone: '+4544556677',
    ratings: [
      { source: 'Google', rating: 4.1, reviewCount: 410 },
      { source: 'Trustpilot', rating: 4.0, reviewCount: 233 },
    ],
  },
];

/** Review-count weighted average across all sources. */
export function overallRating(ratings: SourceRating[]) {
  const total = ratings.reduce((n, r) => n + r.reviewCount, 0);
  if (total === 0) return { rating: 0, reviewCount: 0 };
  const sum = ratings.reduce((n, r) => n + r.rating * r.reviewCount, 0);
  return { rating: sum / total, reviewCount: total };
}

export const getProvider = (id: string) => providers.find((p) => p.id === id);
export const getCategory = (id: CategoryId) => categories.find((c) => c.id === id);
