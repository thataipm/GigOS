// GigOS Chase List — Pending Advances
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getDJData, updateGig, type Gig } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { CurrencyText } from '@/src/components';
import { Glow } from '@/src/theme/effects';
import { MaterialIcons } from '@expo/vector-icons';

export default function ChaseScreen() {
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
      const pending = g.filter(gig =>
        (gig.advance_status === 'requested' || gig.advance_status === 'not_requested') &&
        gig.pipeline_status !== 'paid'
      );
      setGigs(pending.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setError('');
    } catch {
      setError('Could not load advances. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Fixed: only sum advance_amount (the actual amount being chased), not fee
  const totalPending = gigs.reduce((s, g) => s + (g.advance_amount ?? 0), 0);

  const markReceived = async (gig: Gig) => {
    await updateGig(gig.id, { advance_status: 'received', pipeline_status: 'advance_received' });
    setGigs(prev => prev.filter(g => g.id !== gig.id));
  };

  const chaseWhatsApp = (gig: Gig) => {
    const phone = gig.promoter_phone?.replace(/\s/g, '').replace('+', '');
    if (!phone) return;
    const name = gig.promoter_name ? `Hey ${gig.promoter_name}` : 'Hey';
    const msg = encodeURIComponent(`${name}, just checking in on the advance for ${gig.event_name}. Can you confirm? 🙏`);
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  const daysUntil = (dateStr: string) => {
    const d = new Date(dateStr); const now = new Date();
    return Math.ceil((d.getTime() - now.getTime()) / 86400000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity testID="back-from-chase" onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Chase Advances</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={16} color={Colors.amber} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.cyan} size="large" />
          </View>
        ) : (
          <>
            {/* Hero Summary */}
            <View style={styles.heroCard}>
              <View>
                <Text style={styles.heroLabel}>TOTAL PENDING</Text>
                <CurrencyText amount={totalPending} currency={currency} fontSize={34} color={Colors.red} />
                <Text style={styles.heroSub}>{gigs.length} booking{gigs.length !== 1 ? 's' : ''} · sorted by urgency</Text>
              </View>
              <MaterialIcons name="warning" size={40} color="rgba(255,77,94,0.3)" />
            </View>

            {gigs.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.checkCircle, Glow.green]}>
                  <MaterialIcons name="check" size={36} color={Colors.textOnAccent} />
                </View>
                <Text style={styles.emptyTitle}>All advances received.</Text>
                <Text style={styles.emptySub}>Nothing to chase right now.</Text>
              </View>
            ) : (
              gigs.map(gig => {
                const days = daysUntil(gig.date);
                const hasPhone = !!gig.promoter_phone;
                return (
                  <View key={gig.id} style={styles.chaseCard}>
                    <View style={styles.cardSpine} />
                    <View style={styles.cardContent}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardName} numberOfLines={1}>{gig.event_name}</Text>
                        {days > 0 ? (
                          <View style={styles.urgencyBadge}>
                            <Text style={styles.urgencyText}>Gig in {days}d</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.cardMeta}>
                        {gig.venue_name}{gig.promoter_name ? ` · ${gig.promoter_name}` : ''}
                      </Text>
                      <CurrencyText
                        amount={gig.advance_amount ?? 0}
                        currency={currency}
                        fontSize={22}
                        color={Colors.red}
                      />
                      <View style={styles.actionStrip}>
                        <TouchableOpacity
                          testID={`chase-wa-${gig.id}`}
                          onPress={() => chaseWhatsApp(gig)}
                          disabled={!hasPhone}
                          style={[styles.waBtn, !hasPhone && styles.waBtnDisabled]}
                        >
                          <Text style={[styles.waBtnText, !hasPhone && styles.waBtnTextDisabled]}>
                            {hasPhone ? '💬 WhatsApp' : '📵 No phone'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          testID={`mark-received-${gig.id}`}
                          onPress={() => markReceived(gig)}
                          style={styles.receivedBtn}
                        >
                          <Text style={styles.receivedBtnText}>✓ Received</Text>
                        </TouchableOpacity>
                      </View>
                      {!hasPhone ? (
                        <Text style={styles.noPhoneHint}>
                          Add promoter phone in the gig to enable WhatsApp chase.
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  loadingWrap: { paddingTop: 80, alignItems: 'center' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, backgroundColor: Colors.amberDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amber },
  errorText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.amber, flex: 1 },
  heroCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 16, padding: 20, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,77,94,0.25)', backgroundColor: Colors.redDim },
  heroLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, color: Colors.red, textTransform: 'uppercase' },
  heroSub: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: 'rgba(255,77,94,0.70)', marginTop: 4 },
  chaseCard: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,77,94,0.15)', backgroundColor: Colors.surfaceCard, overflow: 'hidden' },
  cardSpine: { width: 3, backgroundColor: Colors.red },
  cardContent: { flex: 1, padding: 16, gap: 6 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { flex: 1, fontFamily: FontFamily.sairaBold, fontSize: 16, color: Colors.textPrimary },
  urgencyBadge: { backgroundColor: 'rgba(255,176,32,0.12)', borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  urgencyText: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.amber },
  cardMeta: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textTertiary },
  actionStrip: { flexDirection: 'row', gap: 8, marginTop: 8 },
  waBtn: { flex: 1, height: 36, borderRadius: 8, backgroundColor: Colors.whatsApp, alignItems: 'center', justifyContent: 'center' },
  waBtnDisabled: { backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.borderDefault },
  waBtnText: { fontFamily: FontFamily.plexSemiBold, fontSize: 12, color: Colors.white },
  waBtnTextDisabled: { color: Colors.textDisabled },
  receivedBtn: { flex: 1, height: 36, borderRadius: 8, backgroundColor: Colors.cyan, alignItems: 'center', justifyContent: 'center' },
  receivedBtnText: { fontFamily: FontFamily.plexSemiBold, fontSize: 12, color: Colors.textOnAccent },
  noPhoneHint: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textDisabled, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: FontFamily.sairaBold, fontSize: 21, color: Colors.textPrimary },
  emptySub: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary },
});
