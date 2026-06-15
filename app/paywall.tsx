// GigOS Paywall — Pro Upgrade Screen with RevenueCat
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { Glow } from '@/src/theme/effects';
import { PrimaryButton, SegmentedControl } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';
import { getOfferings, purchasePackage, restorePurchases } from '@/src/services/purchaseService';
import type { PurchasesPackage } from 'react-native-purchases';

const FEATURES = [
  'Unlimited gigs — no cap',
  'Unlimited expense tracking',
  'Full income history + stream breakdown',
  'Unlimited invoice generation',
  'Follow-up nudge reminders',
  'Verified public profile',
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [plan, setPlan] = useState('Monthly');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    getOfferings().then(offerings => {
      const current = offerings?.current;
      if (!current) return;
      for (const pkg of current.availablePackages) {
        const id = pkg.product.identifier;
        if (id.includes('monthly')) setMonthlyPackage(pkg);
        if (id.includes('yearly') || id.includes('annual')) setAnnualPackage(pkg);
      }
    });
  }, []);

  const selectedPackage = plan === 'Monthly' ? monthlyPackage : annualPackage;
  const monthlyPrice = monthlyPackage?.product.priceString ?? '₹499';
  const annualPrice = annualPackage?.product.priceString ?? '₹3,999';
  const displayPrice = plan === 'Monthly' ? monthlyPrice : annualPrice;

  const handleUpgrade = async () => {
    if (!selectedPackage) {
      Alert.alert('Coming Soon', 'Pro subscriptions are launching very soon. We\'ll notify you!');
      return;
    }
    setLoading(true);
    const result = await purchasePackage(selectedPackage);
    setLoading(false);
    if (result.success) {
      Alert.alert('Welcome to Pro! 🎉', 'Your GigOS Pro subscription is now active.', [
        { text: 'Let\'s go', onPress: () => router.back() },
      ]);
    } else if (!result.cancelled) {
      Alert.alert('Purchase failed', 'Something went wrong. Please try again or restore purchases.');
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const isPro = await restorePurchases();
    setRestoring(false);
    if (isPro) {
      Alert.alert('Restored!', 'Your Pro subscription has been restored.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('No subscription found', 'No active Pro subscription found for this account.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity testID="back-paywall" onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
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
              <View style={styles.checkCircle}>
                <MaterialIcons name="check" size={14} color={Colors.cyan} />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.pricingSection}>
          <SegmentedControl options={['Monthly', 'Annual']} value={plan} onChange={setPlan} />
          {plan === 'Annual' ? (
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>Save ~33%</Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{displayPrice}</Text>
            <Text style={styles.pricePeriod}>/{plan === 'Monthly' ? 'month' : 'year'}</Text>
          </View>
          {plan === 'Annual' ? (
            <Text style={styles.priceMonthly}>~₹333/mo</Text>
          ) : null}
        </View>

        <PrimaryButton
          title={loading ? 'Processing...' : 'UPGRADE TO PRO'}
          onPress={handleUpgrade}
          loading={loading}
          style={{ marginTop: 24 }}
        />
        <Text style={styles.cancelText}>Cancel anytime</Text>

        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn} disabled={restoring}>
          {restoring ? (
            <ActivityIndicator size="small" color={Colors.textTertiary} />
          ) : (
            <Text style={styles.restoreText}>Restore purchases</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8, alignItems: 'center' }}>
          <Text style={styles.laterText}>Maybe later</Text>
        </TouchableOpacity>
      </ScrollView>
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
  restoreBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  restoreText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary },
  laterText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary },
});
