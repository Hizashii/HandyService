import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import type { ReactNode } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
        {children}
      </View>
    </ThemedView>
  );
}

export function AuthInput(props: TextInputProps) {
  return <TextInput placeholderTextColor="#8c8c95" style={styles.input} {...props} />;
}

export function AuthButton({
  label,
  onPress,
  loading = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#3c87f7'} />
      ) : (
        <ThemedText style={variant === 'primary' ? styles.buttonText : styles.secondaryButtonText}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return <ThemedText style={styles.error}>{message}</ThemedText>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.two,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#d7d7df',
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    color: '#000000',
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3c87f7',
    marginTop: Spacing.one,
  },
  secondaryButton: {
    backgroundColor: '#e8efff',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#245fb8',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.55,
  },
  error: {
    color: '#b42318',
    marginTop: Spacing.one,
  },
  linkRow: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d7d7df',
    borderRadius: 14,
    padding: Spacing.three,
    alignItems: 'center',
  },
  roleButtonSelected: {
    borderColor: '#3c87f7',
    backgroundColor: '#e8efff',
  },
});

export const authStyles = styles;
