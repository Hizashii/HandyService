import { cva, type VariantProps } from 'class-variance-authority';
import { View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const badgeVariants = cva('flex-row items-center gap-1 self-start rounded-full px-2.5 py-0.5', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-secondary',
      outline: 'border border-border',
    },
  },
  defaultVariants: { variant: 'secondary' },
});

const labelVariants = cva('text-xs font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
    },
  },
  defaultVariants: { variant: 'secondary' },
});

export type BadgeProps = ViewProps & VariantProps<typeof badgeVariants> & { className?: string };

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      {typeof children === 'string' ? (
        <Text className={labelVariants({ variant })}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
