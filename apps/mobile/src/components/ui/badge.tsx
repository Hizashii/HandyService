import { Chip as HeroChip } from 'heroui-native/chip';
import type { ComponentProps, ReactNode } from 'react';

export type BadgeProps = Omit<ComponentProps<typeof HeroChip>, 'variant'> & {
  children?: ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
};

export function Badge({ variant = 'secondary', children, className, ...props }: BadgeProps) {
  const chipVariant = variant === 'default' ? 'primary' : variant === 'outline' ? 'tertiary' : 'soft';
  return (
    <HeroChip {...props} variant={chipVariant} className={className} size="sm">
      <HeroChip.Label>{children}</HeroChip.Label>
    </HeroChip>
  );
}
