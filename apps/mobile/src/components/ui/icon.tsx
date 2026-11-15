import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { useResolveClassNames } from 'uniwind';
import { cn } from '@/lib/utils';

type IconProps = LucideProps & { as: LucideIcon; className?: string };

/** Resolves Uniwind color classes for Lucide's style-only SVG API. */
export function Icon({ as: IconComponent, className, size = 16, ...props }: IconProps) {
  const style = useResolveClassNames(cn('text-foreground', className));
  return <IconComponent size={size} {...props} style={[style, props.style]} />;
}
