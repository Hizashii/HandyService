/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import { colors, fonts, spacing } from '@/lib/theme';

export const Colors = {
  light: {
    text: colors.light.text,
    background: colors.light.background,
    backgroundElement: colors.light.surfaceMuted,
    backgroundSelected: colors.light.accentSoft,
    textSecondary: colors.light.textSecondary,
  },
  dark: {
    text: colors.dark.text,
    background: colors.dark.background,
    backgroundElement: colors.dark.surfaceMuted,
    backgroundSelected: colors.dark.accentSoft,
    textSecondary: colors.dark.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: fonts.regular,
  serif: fonts.regular,
  rounded: fonts.semibold,
  mono: fonts.mono,
};

export const Spacing = {
  half: 2,
  one: spacing.xs,
  two: spacing.sm,
  three: spacing.lg,
  four: spacing.xl,
  five: spacing['2xl'],
  six: spacing['3xl'],
} as const;

export const BottomTabInset = 84;
export const MaxContentWidth = 720;
