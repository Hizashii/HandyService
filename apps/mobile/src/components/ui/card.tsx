import { Card as HeroCard } from 'heroui-native/card';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export type CardProps = ComponentProps<typeof HeroCard> & { className?: string };

export function Card({ className, children, ...props }: CardProps) {
  return (
    <HeroCard {...props} className={cn('rounded-2xl border border-border bg-surface p-4 shadow-none', className)}>
      {children}
    </HeroCard>
  );
}
