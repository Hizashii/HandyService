import { Button as HeroButton } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import type { PressableProps } from 'react-native';
import type { ReactNode } from 'react';

type ButtonVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-soft';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = PressableProps & {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
};

export const Button = Object.assign(
  function Button({ className, variant = 'default', size = 'default', loading, children, ...props }: ButtonProps) {
    const heroVariant = variant === 'default' ? 'primary' : variant;
    const heroSize = size === 'default' || size === 'icon' ? 'md' : size;

    return (
      <HeroButton
        {...props}
        variant={heroVariant}
        size={heroSize}
        isIconOnly={size === 'icon'}
        isDisabled={props.disabled || loading}
        className={className}>
        {loading ? <Spinner color="accent" size="sm" /> : typeof children === 'string' ? <HeroButton.Label>{children}</HeroButton.Label> : children}
      </HeroButton>
    );
  },
  { Label: HeroButton.Label },
);
