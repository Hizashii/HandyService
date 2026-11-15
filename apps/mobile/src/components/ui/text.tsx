import { cva, type VariantProps } from 'class-variance-authority';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/utils';

export const textVariants = cva('font-sans text-base text-foreground', {
  variants: {
    variant: {
      default: '',
      display: 'text-4xl font-extrabold tracking-tight',
      h1: 'text-3xl font-extrabold tracking-tight',
      h2: 'text-xl font-bold tracking-tight',
      h3: 'text-base font-semibold',
      small: 'text-sm',
      muted: 'text-sm text-text-secondary',
    },
  },
  defaultVariants: { variant: 'default' },
});

export type TextProps = RNTextProps & VariantProps<typeof textVariants> & { className?: string };

export function Text({ className, variant, ...props }: TextProps) {
  return <RNText className={cn(textVariants({ variant }), className)} {...props} />;
}
