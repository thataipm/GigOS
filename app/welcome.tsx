import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout } from '@/src/theme/spacing';
import { PrimaryButton } from '@/src/components';

const FEATURES = [
  { icon: 'event-note' as const,  text: 'Track every gig from enquiry to paid' },
  { icon: 'payments'  as const,  text: 'Chase advances before they slip away'  },
  { icon: 'insights'  as const,  text: 'Know exactly what you\'ve earned'       },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>

      {/* Top accent bar */}
      <View style={styles.topBar} />

      {/* Wordmark */}
      <View style={styles.brandBlock}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>Gig</Text>
          <Text style={[styles.wordmark, { color: Colors.cyan }]}>O</Text>
          <Text style={styles.wordmark}>S</Text>
        </View>
        <Text style={styles.tagline}>Booking management for working artists</Text>
      </View>

      {/* Feature highlights */}
      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MaterialIcons name={f.icon} size={20} color={Colors.cyan} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* Free badge */}
      <View style={styles.freeBadge}>
        <Text style={styles.freeBadgeText}>FREE · NO SUBSCRIPTION · ANDROID</Text>
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <PrimaryButton title="GET STARTED" onPress={() => router.push('/signup')} />
        <TouchableOpacity onPress={() => router.push('/login')} style={styles.signinRow}>
          <Text style={styles.signinGray}>Already have an account? </Text>
          <Text style={styles.signinCyan}>Sign in</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceApp,
    paddingHorizontal: Layout.screenGutter,
  },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: Colors.cyan,
  },
  brandBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: FontFamily.sairaBold,
    fontSize: 52,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: FontFamily.plexRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  features: {
    gap: 16,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(24,200,230,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: FontFamily.plexRegular,
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  freeBadge: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  freeBadgeText: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  ctas: {
    gap: 0,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 4,
  },
  signinGray: {
    fontFamily: FontFamily.plexRegular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signinCyan: {
    fontFamily: FontFamily.plexRegular,
    fontSize: 14,
    color: Colors.cyan,
  },
});
