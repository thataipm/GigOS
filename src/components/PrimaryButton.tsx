// GigOS Primary Button
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, ControlHeight } from '@/src/theme/spacing';
import { Glow } from '@/src/theme/effects';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'whatsapp' | 'danger';
  style?: ViewStyle;
  testID?: string;
}

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary', style, testID }: PrimaryButtonProps) {
  const isPrimary = variant === 'primary';
  const isWhatsapp = variant === 'whatsapp';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      testID={testID || `btn-${title.toLowerCase().replace(/\s/g, '-')}`}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.btn,
        isPrimary && [styles.primary, Glow.cyan],
        isWhatsapp && styles.whatsapp,
        isDanger && styles.danger,
        isGhost && styles.ghost,
        (loading || disabled) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary || isWhatsapp ? Colors.textOnAccent : Colors.cyan} size="small" />
      ) : (
        <Text style={[styles.text, isGhost && styles.ghostText, isDanger && styles.dangerText]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: ControlHeight.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: Colors.cyan, borderWidth: 1, borderColor: Colors.cyanBright },
  whatsapp: { backgroundColor: Colors.whatsApp },
  danger: { backgroundColor: 'rgba(255,77,94,0.12)', borderWidth: 1, borderColor: 'rgba(255,77,94,0.34)' },
  ghost: { borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: 'transparent' },
  disabled: { opacity: 0.7 },
  text: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textOnAccent },
  ghostText: { color: Colors.textSecondary, fontFamily: FontFamily.plexRegular, fontSize: 15 },
  dangerText: { color: Colors.red, fontFamily: FontFamily.plexRegular, fontSize: 15 },
});
