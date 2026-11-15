import { Alert } from 'heroui-native/alert';
import { Button as HeroButton } from 'heroui-native/button';
import { FieldError } from 'heroui-native/field-error';
import { Input as HeroInput } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { Spinner } from 'heroui-native/spinner';
import { TextField } from 'heroui-native/text-field';
import { KeyboardAvoidingView, Platform, ScrollView, View, type TextInputProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';

import { BrandMark } from '@/components/layout/brand-mark';
import { LegalLinks } from '@/components/legal/legal-links';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { photography } from '@/lib/theme/photography';
import { useThemeColor } from 'heroui-native/hooks';

export function AuthShell({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}>
          <View className="mx-auto w-full max-w-[520px] gap-6">
            <View className="gap-6">
              <View className="flex-row items-center justify-between">
                <BrandMark />
              </View>
              <View className="overflow-hidden rounded-tl-[52px] rounded-tr-2xl rounded-bl-2xl rounded-br-[52px] bg-surface-muted">
                <Image source={photography.home} contentFit="cover" style={{ width: '100%', height: eyebrow === 'LOG IND' ? 182 : 128 }} accessible={false} />
              </View>
              <View className="gap-2">
                {eyebrow ? <Text className="text-[10px] leading-4 font-bold uppercase tracking-[3px] text-text-secondary">{eyebrow}</Text> : null}
                <Text variant="display" className="max-w-[360px]">
                  {title}
                </Text>
                <Text className="max-w-[420px] text-[14px] leading-[22px] text-text-secondary">{subtitle}</Text>
              </View>
            </View>
            <View className="gap-4">{children}</View>
            <LegalLinks />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <TextField isRequired isInvalid={Boolean(error)} className="gap-2">
      <Label className="font-semibold text-[13px] text-foreground">{label}</Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

export function AuthInput({ className, ...props }: TextInputProps & { className?: string }) {
  return <HeroInput {...props} className={`min-h-[54px] rounded-xl border border-border bg-field px-4 font-sans text-base shadow-none ${className ?? ''}`} />;
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
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}) {
  const spinnerColor = useThemeColor(variant === 'primary' ? 'accent-foreground' : 'foreground');
  return (
    <HeroButton
      variant={variant}
      size="lg"
      isDisabled={loading}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      className="min-h-[52px] rounded-xl shadow-none">
      {loading ? <Spinner size="sm" color={spinnerColor} /> : <HeroButton.Label>{label}</HeroButton.Label>}
    </HeroButton>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert status="danger" className="rounded-2xl">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Der opstod en fejl</Alert.Title>
        <Alert.Description>{message}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

export function AuthDivider() {
  return (
    <View className="flex-row items-center gap-3 py-1">
      <View className="h-px flex-1 bg-border" />
      <Text variant="small" className="text-text-secondary">
        eller
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}

export const authStyles = {} as const;
