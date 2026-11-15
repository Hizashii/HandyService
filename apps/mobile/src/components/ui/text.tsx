import { cva, type VariantProps } from 'class-variance-authority';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/utils';

export const textVariants = cva('font-sans text-base text-foreground', {
  variants: {
    variant: {
      default: 'leading-6',
      display: 'text-[32px] leading-[39px] font-extrabold tracking-[-1.2px]',
      h1: 'text-[28px] leading-[35px] font-extrabold tracking-[-0.8px]',
      h2: 'text-[20px] leading-[26px] font-bold tracking-[-0.5px]',
      h3: 'text-base leading-[22px] font-bold tracking-[-0.25px]',
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
