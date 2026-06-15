// GigOS GigCard — Main gig card with status spine, advance status prominent
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors, StatusColors, StatusKey } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Space, Layout } from '@/src/theme/spacing';
import { Shadow } from '@/src/theme/effects';
import { StatusBadge } from './StatusBadge';
import { CurrencyText } from './CurrencyText';

interface GigCardProps {
  gigName: string;
  date: string;
  venueName?: string | null;
  gigType: string;
  fee?: number | null;
  currency?: string;
  advanceStatus: string;
  advanceAmount?: number | null;
  pipelineStatus: string;
  balanceStatus?: string;
  onTap?: () => void;
  style?: ViewStyle;
}

const GIG_TYPE_LABELS: Record<string, string> = {
  club_night: 'CLUB NIGHT',
  residency: 'RESIDENCY',
  private_party: 'PRIVATE',
  festival: 'FESTIVAL',
  corporate: 'CORPORATE',
  brand_activation: 'BRAND',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function GigCard({
  gigName, date, venueName, gigType, fee, currency = 'INR',
  advanceStatus, advanceAmount, pipelineStatus, balanceStatus,
  onTap, style,
}: GigCardProps) {
  const spineColor = (StatusColors[pipelineStatus as StatusKey] || StatusColors.enquiry).fg;
  const isEnquiry = pipelineStatus === 'enquiry';
  const balance = fee != null && advanceAmount != null ? fee - advanceAmount : fee;

  return (
    <TouchableOpacity
      testID="gig-card-item"
      activeOpacity={0.85}
      onPress={onTap}
      disabled={!onTap}
      style={[styles.card, Shadow.md, style]}
    >
      {/* Left status spine */}
      <View style={[styles.spine, { backgroundColor: spineColor, shadowColor: spineColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8, elevation: 4 }]} />

      <View style={styles.content}>
        {/* Top row: fee (primary) + gig type pill */}
        <View style={styles.topRow}>
          {isEnquiry ? (
            <Text style={styles.feeTbd}>TBD</Text>
          ) : (
            <CurrencyText amount={fee} currency={currency} fontSize={26} />
          )}
          <View style={styles.typePill}>
            <Text style={styles.typeText}>
              {GIG_TYPE_LABELS[gigType] || gigType.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Balance (only when advance exists and not enquiry) */}
        {!isEnquiry && balance != null && balance !== fee && (
          <Text style={styles.balanceText}>
            Bal: {currency === 'USD' ? '$' : '₹'}{currency === 'USD' ? balance.toLocaleString('en-US') : balance.toLocaleString('en-IN')}
          </Text>
        )}

        {/* Event name */}
        <Text style={styles.gigName} numberOfLines={1}>{gigName}</Text>

        {/* Bottom row: date/venue + status badges */}
        <View style={styles.bottomRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {formatDate(date)}{venueName ? ` · ${venueName}` : ''}
          </Text>
          <View style={styles.badges}>
            <StatusBadge status={advanceStatus as StatusKey} size="sm" />
            <StatusBadge status={pipelineStatus as StatusKey} size="sm" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    overflow: 'hidden',
  },
  spine: {
    width: 4,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  content: {
    flex: 1,
    padding: Layout.cardGap,
    gap: Space.s2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Space.s2,
  },
  gigName: {
    fontFamily: FontFamily.sairaSemiBold,
    fontSize: 15,
    lineHeight: 15 * 1.3,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.graphite600,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  typeText: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
  },
  feeTbd: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 14,
    letterSpacing: 1.2,
    color: Colors.textDisabled,
  },
  balanceText: {
    fontFamily: FontFamily.monoRegular,
    fontSize: 11,
    color: Colors.amber,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Space.s1,
    gap: Space.s2,
  },
  meta: {
    flex: 1,
    fontFamily: FontFamily.plexRegular,
    fontSize: 12,
    lineHeight: 12 * 1.5,
    color: Colors.textTertiary,
  },
  badges: {
    flexDirection: 'row',
    gap: Space.s2,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
});
