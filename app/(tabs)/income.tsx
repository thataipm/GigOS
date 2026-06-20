// GigOS Income Dashboard — Aggregated from Supabase gigs
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDJData, getExpenses, type Gig, type Expense } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { MaterialIcons } from '@expo/vector-icons';
import { CurrencyText, SectionLabel, IncomeSkeleton } from '@/src/components';
import { Glow } from '@/src/theme/effects';

const PERIODS = ['This Year', 'This Month', 'Last Month', 'All Time'];
const STREAM_COLORS: Record<string, string> = { club_night: Colors.violet, residency: Colors.green, brand_activation: Colors.amber, private_party: Colors.red, festival: Colors.cyan, corporate: Colors.slate };
const STREAM_LABELS: Record<string, string> = { club_night: 'Club Nights', residency: 'Residency', brand_activation: 'Brand', private_party: 'Private', festival: 'Festival', corporate: 'Corporate' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function IncomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currency, setCurrency] = useState('INR');
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState('This Year');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ profile: p, gigs: g }, exps] = await Promise.all([getDJData(), getExpenses()]);
      if (p) setCurrency(p.currency);
      setGigs(g);
      setExpenses(exps);
      setError('');
    } catch {
      setError('Could not load income data. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const now = new Date();
  const filtered = gigs.filter(g => {
    const d = new Date(g.date);
    if (period === 'This Year') return d.getFullYear() === now.getFullYear();
    if (period === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'Last Month') { const lm = new Date(now.getFullYear(), now.getMonth() - 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); }
    return true;
  });

  // Exclude enquiries — unconfirmed gigs have no agreed money yet
  const billable = filtered.filter(g => g.pipeline_status !== 'enquiry');
  const enquiryCount = filtered.length - billable.length;

  const total = billable.reduce((s, g) => s + (g.fee || 0), 0);
  const received = billable.reduce((s, g) => {
    if (g.balance_status === 'received') return s + (g.fee || 0);
    if (g.advance_status === 'received') return s + (g.advance_amount || 0);
    return s;
  }, 0);
  const outstanding = total - received;

  // Expenses for the same period
  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    if (period === 'This Year') return d.getFullYear() === now.getFullYear();
    if (period === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'Last Month') { const lm = new Date(now.getFullYear(), now.getMonth() - 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); }
    return true;
  });
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netIncome = received - totalExpenses;

  // Monthly chart data (exclude enquiries)
  const monthlyData = MONTHS.map((_, i) => {
    const monthGigs = gigs.filter(g => { const d = new Date(g.date); return d.getMonth() === i && d.getFullYear() === now.getFullYear() && g.pipeline_status !== 'enquiry'; });
    return monthGigs.reduce((s, g) => s + (g.fee || 0), 0);
  });
  const maxMonth = Math.max(...monthlyData, 1);

  // Stream breakdown (exclude enquiries)
  const streams = Object.entries(billable.reduce((acc, g) => {
    const t = g.gig_type || 'club_night';
    acc[t] = (acc[t] || 0) + (g.fee || 0);
    return acc;
  }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Text style={styles.navTitle}>Income</Text>
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={16} color={Colors.amber} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <IncomeSkeleton />
        ) : (
          <>
        {/* Period Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodBar} contentContainerStyle={{ paddingHorizontal: Layout.screenGutter, gap: 8 }}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[styles.pill, period === p && styles.pillActive]}>
              <Text style={[styles.pillText, period === p && styles.pillTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hero Total */}
        <View style={styles.heroSection}>
          <Text style={styles.heroPeriod}>{period} · {billable.length} gig{billable.length !== 1 ? 's' : ''}{enquiryCount > 0 ? ` · ${enquiryCount} enquir${enquiryCount !== 1 ? 'ies' : 'y'} excluded` : ''}</Text>
          <CurrencyText amount={total} currency={currency} fontSize={56} style={{ textShadowColor: Colors.cyan, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 }} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RECEIVED</Text>
            <CurrencyText amount={received} currency={currency} fontSize={22} color={Colors.green} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>OUTSTANDING</Text>
            <CurrencyText amount={outstanding} currency={currency} fontSize={22} color={Colors.amber} />
          </View>
        </View>
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/expenses')}>
            <Text style={styles.statLabel}>EXPENSES</Text>
            <CurrencyText amount={totalExpenses} currency={currency} fontSize={22} color={Colors.red} />
          </TouchableOpacity>
          <View style={[styles.statCard, { borderColor: netIncome >= 0 ? Colors.green : Colors.red, borderWidth: 1.5 }]}>
            <Text style={styles.statLabel}>NET INCOME</Text>
            <CurrencyText amount={netIncome} currency={currency} fontSize={22} color={netIncome >= 0 ? Colors.green : Colors.red} />
          </View>
        </View>

        {/* Feature Shortcuts */}
        <View style={styles.shortcutRow}>
          <TouchableOpacity style={styles.shortcutCard} onPress={() => router.push('/analytics')}>
            <MaterialIcons name="bar-chart" size={22} color={Colors.cyan} />
            <Text style={styles.shortcutLabel}>Insights</Text>
            <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutCard} onPress={() => router.push('/expenses')}>
            <MaterialIcons name="receipt-long" size={22} color={Colors.amber} />
            <Text style={styles.shortcutLabel}>Expenses</Text>
            <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>MONTHLY EARNINGS · {now.getFullYear()}</Text>
          <View style={styles.chartBars}>
            {monthlyData.map((val, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: Math.max(4, (val / maxMonth) * 160) }, i === now.getMonth() && [styles.barActive, Glow.cyanSm]]} />
                <Text style={[styles.barLabel, i === now.getMonth() && styles.barLabelActive]}>{MONTHS[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stream Breakdown */}
        <View style={{ paddingHorizontal: Layout.screenGutter }}><SectionLabel>BY STREAM</SectionLabel></View>
        <View style={styles.streamContainer}>
          {streams.map(([type, amount]) => (
            <View key={type} style={styles.streamRow}>
              <View style={[styles.streamDot, { backgroundColor: STREAM_COLORS[type] || Colors.textTertiary }]} />
              <Text style={styles.streamName}>{STREAM_LABELS[type] || type}</Text>
              <Text style={styles.streamCount}>{billable.filter(g => g.gig_type === type).length}</Text>
              <CurrencyText amount={amount} currency={currency} fontSize={16} />
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  periodBar: { paddingVertical: 12 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.borderDefault },
  pillActive: { backgroundColor: Colors.cyan, borderColor: Colors.cyan },
  pillText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary },
  pillTextActive: { fontFamily: FontFamily.sairaSemiBold, fontSize: 13, color: Colors.textOnAccent },
  heroSection: { paddingHorizontal: Layout.screenGutter, paddingVertical: 20, backgroundColor: Colors.surfaceRaised },
  heroPeriod: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: Layout.screenGutter, paddingVertical: 12 },
  statCard: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, padding: 14, gap: 6 },
  statLabel: { fontFamily: FontFamily.monoMedium, fontSize: 11, letterSpacing: 1, color: Colors.textTertiary, textTransform: 'uppercase' },
  shortcutRow: { flexDirection: 'row', gap: 10, paddingHorizontal: Layout.screenGutter, marginBottom: 16 },
  shortcutCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 14, paddingVertical: 14 },
  shortcutLabel: { flex: 1, fontFamily: FontFamily.sairaSemiBold, fontSize: 14, color: Colors.textPrimary },
  chartContainer: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, marginHorizontal: Layout.screenGutter, padding: 16, marginBottom: 16 },
  chartTitle: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase', marginBottom: 12 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 180, gap: 2 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '80%', borderRadius: 3, backgroundColor: 'rgba(24,200,230,0.20)' },
  barActive: { backgroundColor: Colors.cyan },
  barLabel: { fontFamily: FontFamily.monoMedium, fontSize: 8, color: Colors.textTertiary },
  barLabelActive: { color: Colors.cyan },
  streamContainer: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, marginHorizontal: Layout.screenGutter, overflow: 'hidden' },
  streamRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: 10 },
  streamDot: { width: 10, height: 10, borderRadius: 5 },
  streamName: { flex: 1, fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textPrimary },
  streamCount: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary, marginRight: 8 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, backgroundColor: Colors.amberDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amber },
  errorBannerText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.amber, flex: 1 },
});
