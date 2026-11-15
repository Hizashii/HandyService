import { cva, type VariantProps } from 'class-variance-authority';
import { Pressable, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-md active:opacity-80',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'border border-input bg-background',
        ghost: '',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 px-3',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const labelVariants = cva('font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & { className?: string };

export function Button({ className, variant, size, children, ...props }: ButtonProps) {
  return (
    <Pressable
      role="button"
      className={cn(buttonVariants({ variant, size }), props.disabled && 'opacity-50', className)}
      {...props}>
      {typeof children === 'string' ? (
        <Text className={labelVariants({ variant })}>{children}</Text>
      ) : (
        (children as React.ReactNode)
      )}
    </Pressable>
  );
}
