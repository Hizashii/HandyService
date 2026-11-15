import { Platform } from 'react-native';

export const colors = {
  light: {
    brand: '#087F5B',
    brandDark: '#075C43',
    background: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceMuted: '#F4F7F3',
    text: '#171C19',
    textSecondary: '#747D76',
    border: '#E6EAE5',
    accentSoft: '#E6F3EC',
    error: '#C43D3D',
    success: '#087F5B',
    onBrand: '#FFFFFF',
  },
  dark: {
    brand: '#2EA875',
    brandDark: '#8FE0B7',
    background: '#0E1713',
    surface: '#16221C',
    surfaceMuted: '#1D2B24',
    text: '#F3F8F4',
    textSecondary: '#A3B1A8',
    border: '#304239',
    accentSoft: '#173B2D',
    error: '#EF7777',
    success: '#2EA875',
    onBrand: '#07130D',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = (typeof colors)[ColorScheme];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radii = {
  control: 14,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

export const typography = {
  display: 36,
  title: 28,
  heading: 20,
  body: 16,
  label: 14,
  caption: 12,
} as const;

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const motion = {
  fast: 140,
  normal: 220,
  slow: 360,
} as const;
