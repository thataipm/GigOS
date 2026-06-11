// GigOS AlertBanner — red glowing banner for pending advances
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Space, Layout } from '@/src/theme/spacing';
import { Glow } from '@/src/theme/effects';
import { MaterialIcons } from '@expo/vector-icons';

interface AlertBannerProps {
  message: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function AlertBanner({ message, subtitle, onPress, style }: AlertBannerProps) {
  return (
    <TouchableOpacity
      testID="alert-banner"
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.container, Glow.red, style]}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name="warning" size={20} color={Colors.red} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.message}>{message}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onPress ? (
        <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,77,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,94,0.34)',
    borderRadius: Radius.sm,
    paddingVertical: Space.s3,
    paddingHorizontal: Space.s4,
    gap: Space.s3,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,77,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontFamily: FontFamily.plexSemiBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: FontFamily.plexRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
