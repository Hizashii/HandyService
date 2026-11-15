import { Card as HeroCard } from 'heroui-native/card';
import type { ComponentProps } from 'react';

export type CardProps = ComponentProps<typeof HeroCard> & { className?: string };

export function Card({ className, children, ...props }: CardProps) {
  return (
    <HeroCard {...props} className={className ?? 'border border-border bg-surface'}>
      {children}
    </HeroCard>
  );
}
