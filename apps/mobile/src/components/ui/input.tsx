import { Input as HeroInput } from 'heroui-native/input';
import type { ComponentProps } from 'react';

export type InputProps = ComponentProps<typeof HeroInput> & { className?: string };

export function Input({ className, ...props }: InputProps) {
  return <HeroInput className={className ?? 'text-base'} {...props} />;
}
