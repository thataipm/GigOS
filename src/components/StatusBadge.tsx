// GigOS StatusBadge — pill-shaped status indicator with glow
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { StatusColors, Colors, StatusKey } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius } from '@/src/theme/spacing';
import { StatusGlow } from '@/src/theme/effects';

type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  status: StatusKey;
  label?: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'PENDING',
  received: 'RECEIVED',
  due: 'BALANCE DUE',
  paid: 'PAID',
  enquiry: 'ENQUIRY',
  not_requested: 'NOT REQ',
  requested: 'REQUESTED',
  waived: 'WAIVED',
  confirmed: 'CONFIRMED',
  advance_received: 'ADV RECEIVED',
  done: 'DONE',
};

export function StatusBadge({ status, label, size = 'md', style }: StatusBadgeProps) {
  const colors = StatusColors[status] || StatusColors.enquiry;
  const glow = StatusGlow[status] || {};
  const sm = size === 'sm';

  return (
    <View
      testID="gig-status-badge"
      style={[
        styles.badge,
        {
          height: sm ? 26 : 28,
          paddingHorizontal: sm ? 9 : 11,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        glow,
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: colors.fg, width: sm ? 7 : 8, height: sm ? 7 : 8 }]} />
      <Text
        style={[
          styles.label,
          {
            fontSize: 11,
            color: colors.fg,
          },
        ]}
      >
        {label || STATUS_LABELS[status] || status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: 999,
  },
  label: {
    fontFamily: FontFamily.monoMedium,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
