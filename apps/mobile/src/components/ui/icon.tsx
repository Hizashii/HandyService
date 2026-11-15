import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { StyleSheet, type TextStyle } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { cn } from '@/lib/utils';

type IconProps = LucideProps & { as: LucideIcon; className?: string };

/** Resolves Uniwind color classes for Lucide's style-only SVG API. */
export function Icon({ as: IconComponent, className, size = 16, ...props }: IconProps) {
  const style = useResolveClassNames(cn('text-foreground', className));
  const resolved = StyleSheet.flatten(style) as TextStyle;
  return <IconComponent size={size} color={props.color ?? resolved.color} {...props} style={[style, props.style]} />;
}
