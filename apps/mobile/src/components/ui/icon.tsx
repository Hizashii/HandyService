import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

import { cn } from '@/lib/utils';

const interopered = new WeakSet<LucideIcon>();

type IconProps = LucideProps & { as: LucideIcon; className?: string };

/** Renders a lucide icon that can be styled with Tailwind classes (e.g. `text-primary`). */
export function Icon({ as: IconComponent, className, size = 16, ...props }: IconProps) {
  if (!interopered.has(IconComponent)) {
    cssInterop(IconComponent, {
      className: { target: 'style', nativeStyleToProp: { color: true, opacity: true } },
    });
    interopered.add(IconComponent);
  }
  return <IconComponent size={size} className={cn('text-foreground', className)} {...props} />;
}
