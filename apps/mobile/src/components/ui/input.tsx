import { TextInput, type TextInputProps } from 'react-native';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      className={cn(
        'h-11 rounded-md border border-input bg-background px-3 text-base text-foreground',
        className
      )}
      placeholderTextColor="#8a8a8a"
      {...props}
    />
  );
}
