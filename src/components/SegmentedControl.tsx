// GigOS Segmented Control
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, ControlHeight } from '@/src/theme/spacing';
import { Glow } from '@/src/theme/effects';

interface SegmentedControlProps {
  options: string[];
  value: string | null;
  onChange: (val: string) => void;
  label?: string;
}

export function SegmentedControl({ options, value, onChange, label }: SegmentedControlProps) {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.container}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              testID={`segment-${opt.toLowerCase().replace(/\s/g, '-')}`}
              onPress={() => onChange(opt)}
              style={[styles.segment, active && styles.segmentActive, active && Glow.cyanSm]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface TagGridProps {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  label?: string;
  single?: boolean;
}

export function TagGrid({ options, selected, onToggle, label, single }: TagGridProps) {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.tagGrid}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              testID={`tag-${opt.toLowerCase().replace(/\s/g, '-')}`}
              onPress={() => onToggle(opt)}
              style={[styles.tag, active && styles.tagActive]}
            >
              <Text style={[styles.tagText, active && styles.tagTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    height: ControlHeight.md,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentActive: { backgroundColor: Colors.cyan },
  segmentText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary },
  segmentTextActive: { fontFamily: FontFamily.sairaBold, fontSize: 13, color: Colors.textOnAccent },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  tagActive: {
    backgroundColor: 'rgba(24,200,230,0.12)',
    borderColor: 'rgba(24,200,230,0.34)',
  },
  tagText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary },
  tagTextActive: { color: Colors.cyan },
});
