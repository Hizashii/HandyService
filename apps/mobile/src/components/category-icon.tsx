import {
  Droplets,
  Hammer,
  Leaf,
  Paintbrush,
  SprayCan,
  Sparkles,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

import type { CategoryId } from '@/data/types';

export const categoryIcons: Record<CategoryId, LucideIcon> = {
  carpentry: Hammer,
  cleaning: SprayCan,
  'window-cleaning': Sparkles,
  plumbing: Droplets,
  electrical: Zap,
  painting: Paintbrush,
  gardening: Leaf,
  moving: Truck,
  repairs: Wrench,
};
