// GigOS SectionLabel — IBM Plex Mono 10px uppercase
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { FontFamily } from '@/src/theme/typography';
import { Colors } from '@/src/theme/colors';

interface SectionLabelProps {
  children: string;
  style?: TextStyle;
}

export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <Text testID="section-label" style={[styles.label, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.textTertiary,
  },
});
