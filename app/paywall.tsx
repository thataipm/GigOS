// GigOS Paywall — Pro Upgrade Screen
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Space, Layout, Radius } from '@/src/theme/spacing';
import { Glow } from '@/src/theme/effects';
import { PrimaryButton, SegmentedControl } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

const FEATURES = [
  'Unlimited gigs — no cap',
  'Full income history + stream breakdown',
  'CSV export for your CA',
  'Follow-up nudge reminders',
  'Verified public profile',
  'Calendar sync',
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [plan, setPlan] = useState('Monthly');
  const [toastVisible, setToastVisible] = useState(false);

  const handleUpgrade = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity testID="back-paywall" onPress={() => router.back()}><MaterialIcons name="chevron-left" size={28} color={Colors.cyan} /></TouchableOpacity>
        <Text style={styles.navTitle}>Go Pro</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <View style={[styles.crownIcon, Glow.cyan]}>
            <MaterialIcons name="star" size={32} color={Colors.textOnAccent} />
          </View>
          <Text style={styles.heroTitle}>Go Pro.</Text>
          <Text style={styles.heroSub}>Run your entire DJ business.</Text>
        </View>

        {/* Features */}
        <View style={styles.featureList}>
          {FEATURES.map(f => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.checkCircle}><MaterialIcons name="check" size={14} color={Colors.cyan} /></View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.pricingSection}>
          <SegmentedControl options={['Monthly', 'Annual']} value={plan} onChange={setPlan} />
          {plan === 'Annual' ? <View style={styles.saveBadge}><Text style={styles.saveText}>Save 17%</Text></View> : null}
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{plan === 'Monthly' ? '₹999' : '₹9,999'}</Text>
            <Text style={styles.pricePeriod}>/{plan === 'Monthly' ? 'month' : 'year'}</Text>
          </View>
          {plan === 'Annual' ? <Text style={styles.priceMonthly}>~₹833/mo</Text> : null}
        </View>

        <PrimaryButton title="UPGRADE TO PRO" onPress={handleUpgrade} style={{ marginTop: 24 }} />
        <Text style={styles.cancelText}>Cancel anytime</Text>

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={styles.laterText}>Maybe later</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Toast */}
      {toastVisible ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Pro subscriptions launching soon. We'll notify you!</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingBottom: 40 },
  heroWrap: { alignItems: 'center', paddingTop: 48 },
  crownIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.cyan, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: FontFamily.sairaBold, fontSize: 40, color: Colors.textPrimary, marginTop: 20 },
  heroSub: { fontFamily: FontFamily.plexRegular, fontSize: 17, color: Colors.textSecondary, marginTop: 8 },
  featureList: { marginTop: 32, gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(24,200,230,0.12)', borderWidth: 1, borderColor: 'rgba(24,200,230,0.34)', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary },
  pricingSection: { marginTop: 32, alignItems: 'center' },
  saveBadge: { backgroundColor: 'rgba(46,230,160,0.12)', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  saveText: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.green },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16 },
  priceAmount: { fontFamily: FontFamily.sairaBold, fontSize: 40, color: Colors.textPrimary },
  pricePeriod: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary },
  priceMonthly: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  cancelText: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary, textAlign: 'center', marginTop: 8 },
  laterText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary },
  toast: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.cyan, borderRadius: Radius.md, padding: 14, alignItems: 'center' },
  toastText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textPrimary },
});
