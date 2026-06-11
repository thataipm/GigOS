// GigOS Analytics — Business Intelligence Dashboard
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getDJData, type Gig } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { CurrencyText, SectionLabel } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STAGE_ORDER = ['enquiry', 'confirmed', 'advance_received', 'done', 'paid'];
const STAGE_LABELS: Record<string, string> = { enquiry: 'Enquiry', confirmed: 'Confirmed', advance_received: 'Advance In', done: 'Done', paid: 'Paid' };
const STAGE_COLORS: Record<string, string> = { enquiry: Colors.violet, confirmed: Colors.cyan, advance_received: Colors.green, done: Colors.amber, paid: Colors.slate };
const TYPE_LABELS: Record<string, string> = { club_night: 'Club Nights', residency: 'Residency', brand_activation: 'Brand Activation', private_party: 'Private Party', festival: 'Festival', corporate: 'Corporate' };
const TYPE_COLORS: Record<string, string> = { club_night: Colors.violet, residency: Colors.green, brand_activation: Colors.amber, private_party: Colors.red, festival: Colors.cyan, corporate: Colors.slate };

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { profile: p, gigs: g } = await getDJData();
      if (p) setCurrency(p.currency);
      setGigs(g);
      setError('');
    } catch {
      setError('Could not load analytics. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const stats = useMemo(() => {
    if (gigs.length === 0) return null;
    const now = new Date();

    // ── Summary stats ──
    const totalRevenue = gigs.reduce((s, g) => s + (g.fee || 0), 0);
    const received = gigs.reduce((s, g) => {
      if (g.balance_status === 'received') return s + (g.fee || 0);
      if (g.advance_status === 'received') return s + (g.advance_amount || 0);
      return s;
    }, 0);
    const outstanding = gigs
      .filter(g => g.balance_status !== 'received')
      .reduce((s, g) => {
        if (g.advance_status === 'received') return s + ((g.fee || 0) - (g.advance_amount || 0));
        return s + (g.fee || 0);
      }, 0);
    const avgFee = gigs.filter(g => g.fee).length > 0
      ? Math.round(totalRevenue / gigs.filter(g => g.fee).length)
      : 0;
    const collectionRate = totalRevenue > 0 ? Math.round((received / totalRevenue) * 100) : 0;

    // ── Pipeline funnel ──
    const stageCounts = STAGE_ORDER.map(s => ({
      key: s,
      label: STAGE_LABELS[s],
      count: gigs.filter(g => g.pipeline_status === s).length,
      color: STAGE_COLORS[s],
    }));

    // ── Monthly revenue (last 12 months rolling) ──
    const monthlyData: { label: string; value: number; isCurrent: boolean }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const val = gigs
        .filter(g => { const gd = new Date(g.date); return gd.getFullYear() === y && gd.getMonth() === m; })
        .reduce((s, g) => s + (g.fee || 0), 0);
      monthlyData.push({ label: MONTHS_SHORT[m], value: val, isCurrent: i === 0 });
    }
    const maxMonthly = Math.max(...monthlyData.map(m => m.value), 1);

    // ── Top promoters (by total fee, min 1 gig) ──
    const promoterMap: Record<string, { revenue: number; count: number }> = {};
    gigs.forEach(g => {
      if (!g.promoter_name) return;
      if (!promoterMap[g.promoter_name]) promoterMap[g.promoter_name] = { revenue: 0, count: 0 };
      promoterMap[g.promoter_name].revenue += g.fee || 0;
      promoterMap[g.promoter_name].count++;
    });
    const topPromoters = Object.entries(promoterMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, { revenue, count }]) => ({ name, revenue, count }));
    const maxPromoterRevenue = Math.max(...topPromoters.map(p => p.revenue), 1);

    // ── Top venues ──
    const venueMap: Record<string, { revenue: number; count: number }> = {};
    gigs.forEach(g => {
      const v = g.venue_name || 'Unknown Venue';
      if (!venueMap[v]) venueMap[v] = { revenue: 0, count: 0 };
      venueMap[v].revenue += g.fee || 0;
      venueMap[v].count++;
    });
    const topVenues = Object.entries(venueMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, { revenue, count }]) => ({ name, revenue, count }));
    const maxVenueRevenue = Math.max(...topVenues.map(v => v.revenue), 1);

    // ── Revenue by gig type ──
    const typeMap: Record<string, number> = {};
    gigs.forEach(g => {
      const t = g.gig_type || 'other';
      typeMap[t] = (typeMap[t] || 0) + (g.fee || 0);
    });
    const typeBreakdown = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([type, revenue]) => ({ type, revenue, label: TYPE_LABELS[type] || type }));
    const maxType = Math.max(...typeBreakdown.map(t => t.revenue), 1);

    return {
      totalRevenue, received, outstanding, avgFee, collectionRate,
      stageCounts, monthlyData, maxMonthly,
      topPromoters, maxPromoterRevenue,
      topVenues, maxVenueRevenue,
      typeBreakdown, maxType,
    };
  }, [gigs]);

  const sym = currency === 'USD' ? '$' : '₹';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Insights</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={16} color={Colors.amber} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={Colors.cyan} size="large" /></View>
        ) : !stats ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="bar-chart" size={48} color={Colors.surfaceCard} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySub}>Add your first gig to see analytics here.</Text>
          </View>
        ) : (
          <>
            {/* ── Summary tiles ── */}
            <View style={styles.tilesRow}>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>TOTAL BILLED</Text>
                <CurrencyText amount={stats.totalRevenue} currency={currency} fontSize={20} />
                <Text style={styles.tileSub}>{gigs.length} gigs</Text>
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>COLLECTED</Text>
                <CurrencyText amount={stats.received} currency={currency} fontSize={20} color={Colors.green} />
                <Text style={[styles.tileSub, { color: Colors.green }]}>{stats.collectionRate}% rate</Text>
              </View>
            </View>
            <View style={styles.tilesRow}>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>OUTSTANDING</Text>
                <CurrencyText amount={stats.outstanding} currency={currency} fontSize={20} color={Colors.amber} />
                <Text style={styles.tileSub}>to chase</Text>
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>AVG FEE</Text>
                <CurrencyText amount={stats.avgFee} currency={currency} fontSize={20} color={Colors.cyan} />
                <Text style={styles.tileSub}>per gig</Text>
              </View>
            </View>

            {/* ── Pipeline Funnel ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>PIPELINE FUNNEL</Text>
              <View style={styles.funnelRow}>
                {stats.stageCounts.map((st, i) => (
                  <React.Fragment key={st.key}>
                    <View style={styles.funnelStage}>
                      <View style={[styles.funnelBox, { borderColor: st.color }]}>
                        <Text style={[styles.funnelCount, { color: st.color }]}>{st.count}</Text>
                      </View>
                      <Text style={styles.funnelLabel}>{st.label.replace(' ', '\n')}</Text>
                      {i > 0 && st.count > 0 && stats.stageCounts[i - 1].count > 0 ? (
                        <Text style={styles.funnelRate}>
                          {Math.round((st.count / stats.stageCounts[i - 1].count) * 100)}%
                        </Text>
                      ) : null}
                    </View>
                    {i < stats.stageCounts.length - 1 ? (
                      <MaterialIcons name="chevron-right" size={20} color={Colors.textDisabled} style={{ marginBottom: 20 }} />
                    ) : null}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* ── Monthly Revenue ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>REVENUE — LAST 12 MONTHS</Text>
              <View style={styles.chartBars}>
                {stats.monthlyData.map((m, i) => (
                  <View key={i} style={styles.barCol}>
                    <View style={[
                      styles.bar,
                      { height: Math.max(4, (m.value / stats.maxMonthly) * 88) },
                      m.isCurrent && styles.barActive,
                    ]} />
                    <Text style={[styles.barLabel, m.isCurrent && styles.barLabelActive]}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Top Promoters ── */}
            {stats.topPromoters.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>TOP PROMOTERS</Text>
                {stats.topPromoters.map((p, i) => (
                  <View key={p.name} style={styles.rankRow}>
                    <Text style={styles.rankNum}>#{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.rankNameRow}>
                        <Text style={styles.rankName} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.rankCount}>{p.count} gig{p.count > 1 ? 's' : ''}</Text>
                        <CurrencyText amount={p.revenue} currency={currency} fontSize={14} />
                      </View>
                      <View style={styles.rankBarBg}>
                        <View style={[styles.rankBar, { width: `${(p.revenue / stats.maxPromoterRevenue) * 100}%`, backgroundColor: Colors.cyan }]} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* ── Top Venues ── */}
            {stats.topVenues.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>TOP VENUES</Text>
                {stats.topVenues.map((v, i) => (
                  <View key={v.name} style={styles.rankRow}>
                    <Text style={styles.rankNum}>#{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.rankNameRow}>
                        <Text style={styles.rankName} numberOfLines={1}>{v.name}</Text>
                        <Text style={styles.rankCount}>{v.count} gig{v.count > 1 ? 's' : ''}</Text>
                        <CurrencyText amount={v.revenue} currency={currency} fontSize={14} />
                      </View>
                      <View style={styles.rankBarBg}>
                        <View style={[styles.rankBar, { width: `${(v.revenue / stats.maxVenueRevenue) * 100}%`, backgroundColor: Colors.violet }]} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* ── Revenue by Gig Type ── */}
            {stats.typeBreakdown.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>BY GIG TYPE</Text>
                {stats.typeBreakdown.map(t => (
                  <View key={t.type} style={styles.typeRow}>
                    <View style={[styles.typeDot, { backgroundColor: TYPE_COLORS[t.type] || Colors.slate }]} />
                    <Text style={styles.typeLabel} numberOfLines={1}>{t.label}</Text>
                    <View style={styles.typeBarBg}>
                      <View style={[
                        styles.typeBar,
                        { width: `${(t.revenue / stats.maxType) * 100}%`, backgroundColor: TYPE_COLORS[t.type] || Colors.slate },
                      ]} />
                    </View>
                    <Text style={styles.typeAmt}>{sym}{(t.revenue / 1000).toFixed(0)}k</Text>
                  </View>
                ))}
              </View>
            ) : null}

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
  scroll: { paddingHorizontal: Layout.screenGutter, paddingTop: 16 },
  loadingWrap: { paddingTop: 80, alignItems: 'center' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: Colors.amberDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amber, marginBottom: 16 },
  errorText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.amber, flex: 1 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontFamily: FontFamily.sairaBold, fontSize: 20, color: Colors.textPrimary },
  emptySub: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  // Tiles
  tilesRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tile: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, padding: 14, gap: 4 },
  tileLabel: { fontFamily: FontFamily.monoMedium, fontSize: 9, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase' },
  tileSub: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary },
  // Cards
  card: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, padding: 16, marginBottom: 12 },
  cardTitle: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase', marginBottom: 14 },
  // Funnel
  funnelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  funnelStage: { alignItems: 'center', flex: 1 },
  funnelBox: { width: 44, height: 44, borderRadius: Radius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  funnelCount: { fontFamily: FontFamily.sairaBold, fontSize: 16 },
  funnelLabel: { fontFamily: FontFamily.monoMedium, fontSize: 8, letterSpacing: 0.5, color: Colors.textTertiary, textAlign: 'center', textTransform: 'uppercase' },
  funnelRate: { fontFamily: FontFamily.monoMedium, fontSize: 8, color: Colors.textDisabled, marginTop: 2 },
  // Bar chart
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 104, gap: 2 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '80%', borderRadius: 3, backgroundColor: 'rgba(24,200,230,0.18)' },
  barActive: { backgroundColor: Colors.cyan },
  barLabel: { fontFamily: FontFamily.monoMedium, fontSize: 7, color: Colors.textTertiary },
  barLabelActive: { color: Colors.cyan },
  // Rankings
  rankRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  rankNum: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.textDisabled, width: 20, paddingTop: 2 },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  rankName: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  rankCount: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary },
  rankBarBg: { height: 4, backgroundColor: Colors.surfaceInput, borderRadius: 2, overflow: 'hidden' },
  rankBar: { height: 4, borderRadius: 2 },
  // Gig types
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeLabel: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textSecondary, width: 90 },
  typeBarBg: { flex: 1, height: 6, backgroundColor: Colors.surfaceInput, borderRadius: 3, overflow: 'hidden' },
  typeBar: { height: 6, borderRadius: 3 },
  typeAmt: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.textSecondary, width: 36, textAlign: 'right' },
});
