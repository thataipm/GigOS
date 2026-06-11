// GigOS Meter — segmented lit-bar, DJ mixer level-meter aesthetic.
// Shows payment progress: advance received vs total fee.
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Glow } from '@/src/theme/effects';

type MeterTone = 'cyan' | 'green' | 'amber' | 'red';

interface MeterProps {
  /** 0–1 fill fraction */
  value?: number;
  segments?: number;
  tone?: MeterTone;
  label?: string;
  valueLabel?: string;
  style?: ViewStyle;
}

const TONE_COLORS: Record<MeterTone, string> = {
  cyan:  Colors.cyan,
  green: Colors.green,
  amber: Colors.amber,
  red:   Colors.red,
};

const TONE_GLOW: Record<MeterTone, object> = {
  cyan:  Glow.cyanSm,
  green: Glow.green,
  amber: Glow.amber,
  red:   Glow.red,
};

export function Meter({ value = 0, segments = 16, tone = 'cyan', label, valueLabel, style }: MeterProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const lit = Math.round(clamped * segments);
  const onColor = TONE_COLORS[tone];
  const glow = TONE_GLOW[tone];

  return (
    <View style={[styles.root, style]}>
      {(label || valueLabel) ? (
        <View style={styles.header}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {valueLabel ? <Text style={[styles.valueLabel, { color: onColor }]}>{valueLabel}</Text> : null}
        </View>
      ) : null}
      <View style={styles.track}>
        {Array.from({ length: segments }).map((_, i) => {
          const on = i < lit;
          return (
            <View
              key={i}
              style={[
                styles.segment,
                on
                  ? [{ backgroundColor: onColor }, glow]
                  : styles.segmentOff,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textTertiary,
  },
  valueLabel: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  track: { flexDirection: 'row', gap: 3, height: 16 },
  segment: {
    flex: 1,
    borderRadius: 2,
  },
  segmentOff: {
    backgroundColor: Colors.surfaceInput,
  },
});
