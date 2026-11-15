import { cva, type VariantProps } from 'class-variance-authority';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/utils';

export const textVariants = cva('text-base text-foreground', {
  variants: {
    variant: {
      default: '',
      h1: 'text-3xl font-bold tracking-tight',
      h2: 'text-xl font-semibold tracking-tight',
      h3: 'text-base font-semibold',
      small: 'text-sm',
      muted: 'text-sm text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

export type TextProps = RNTextProps & VariantProps<typeof textVariants> & { className?: string };

export function Text({ className, variant, ...props }: TextProps) {
  return <RNText className={cn(textVariants({ variant }), className)} {...props} />;
}
