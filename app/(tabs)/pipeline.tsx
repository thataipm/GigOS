// GigOS Pipeline — List view with collapsible sections
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDJData, type Gig, type DJProfile } from '@/src/services/supabaseData';
import { Colors, StatusColors, StatusKey } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { GigCard, AlertBanner, PipelineSkeleton } from '@/src/components';
import { Glow } from '@/src/theme/effects';
import { MaterialIcons } from '@expo/vector-icons';

const COLUMNS = [
  { key: 'enquiry', label: 'ENQUIRY' },
  { key: 'confirmed', label: 'CONFIRMED' },
  { key: 'advance_received', label: 'ADVANCE IN' },
  { key: 'done', label: 'DONE' },
  { key: 'paid', label: 'PAID' },
].map(c => ({ ...c, color: StatusColors[c.key as StatusKey]?.fg ?? Colors.textTertiary }));

const FILTERS = ['All', 'This Week', 'This Month', 'Enquiries'];

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
}

export default function PipelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const { profile: p, gigs: g } = await getDJData();
      setProfile(p); setGigs(g); setError('');
    } catch {
      setError('Could not load your gigs. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const pendingAdvances = gigs.filter(g =>
    (g.advance_status === 'requested' || g.advance_status === 'not_requested') &&
    g.pipeline_status !== 'paid'
  );
  // Fixed: only count advance_amount (not fee) as the actual amount being chased
  const pendingTotal = pendingAdvances.reduce((sum, g) => sum + (g.advance_amount ?? 0), 0);

  const filteredGigs = gigs.filter(g => {
    if (filter === 'Enquiries') return g.pipeline_status === 'enquiry';
    if (filter === 'This Week') {
      const d = new Date(g.date); const now = new Date();
      const diff = (d.getTime() - now.getTime()) / 86400000;
      return diff >= -1 && diff <= 7;
    }
    if (filter === 'This Month') {
      const d = new Date(g.date); const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const djName = profile?.name?.split(' ').pop() || 'DJ';
  const currency = profile?.currency || 'INR';
  const todayStr = new Date().toISOString().split('T')[0];
  const tonightGigs = filteredGigs.filter(g => g.date === todayStr);

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.djName}>{djName}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity testID="nudge-bell" onPress={() => router.push('/nudge')}>
            <MaterialIcons name="notifications-none" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity testID="profile-avatar" onPress={() => router.push('/settings')} style={styles.avatar}>
            <Text style={styles.avatarText}>{djName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
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

        {pendingAdvances.length > 0 ? (
          <View style={{ paddingHorizontal: Layout.screenGutter, paddingTop: 8 }}>
            <AlertBanner
              message={`${pendingAdvances.length} advance${pendingAdvances.length > 1 ? 's' : ''} pending${pendingTotal > 0 ? ` — ${currency === 'USD' ? '$' : '₹'}${pendingTotal.toLocaleString()} to chase` : ''}`}
              onPress={() => router.push('/chase')}
            />
          </View>
        ) : null}

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: Layout.screenGutter, gap: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              testID={`filter-${f.toLowerCase().replace(/\s/g, '-')}`}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <PipelineSkeleton />
        ) : gigs.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="queue-music" size={48} color={Colors.surfaceCard} />
            <Text style={styles.emptyTitle}>No gigs yet, {djName}.</Text>
            <Text style={styles.emptySubtext}>Drop your next booking here.</Text>
            <TouchableOpacity testID="add-first-gig" onPress={() => router.push('/(tabs)/add-gig')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>ADD YOUR FIRST GIG</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {/* TONIGHT pin — gigs happening today */}
            {tonightGigs.length > 0 ? (
              <View style={styles.tonightSection}>
                <View style={styles.tonightHeader}>
                  <View style={[styles.tonightDot, Glow.cyanSm]} />
                  <Text style={styles.tonightLabel}>TONIGHT</Text>
                  <View style={styles.countBadge}><Text style={styles.countText}>{tonightGigs.length}</Text></View>
                </View>
                <View style={styles.listCards}>
                  {tonightGigs.map(g => (
                    <GigCard
                      key={g.id}
                      gigName={g.event_name}
                      date={g.date}
                      venueName={g.venue_name}
                      gigType={g.gig_type}
                      fee={g.fee}
                      currency={currency}
                      advanceStatus={g.advance_status}
                      advanceAmount={g.advance_amount}
                      pipelineStatus={g.pipeline_status}
                      onTap={() => router.push(`/gig/${g.id}`)}
                      style={styles.tonightCard}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {COLUMNS.map(col => {
              const colGigs = filteredGigs
                .filter(g => g.pipeline_status === col.key)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              const isCollapsed = collapsed.has(col.key);
              return (
                <View key={col.key}>
                  <TouchableOpacity
                    testID={`section-${col.key}`}
                    onPress={() => toggleCollapse(col.key)}
                    style={styles.listSectionHeader}
                  >
                    <View style={[styles.sectionDot, { backgroundColor: col.color }]} />
                    <Text style={styles.sectionLabel}>{col.label}</Text>
                    <View style={styles.countBadge}><Text style={styles.countText}>{colGigs.length}</Text></View>
                    <MaterialIcons name={isCollapsed ? 'chevron-right' : 'expand-more'} size={20} color={Colors.textTertiary} />
                  </TouchableOpacity>
                  {!isCollapsed ? (
                    <View style={styles.listCards}>
                      {colGigs.map(g => (
                        <GigCard
                          key={g.id}
                          gigName={g.event_name}
                          date={g.date}
                          venueName={g.venue_name}
                          gigType={g.gig_type}
                          fee={g.fee}
                          currency={currency}
                          advanceStatus={g.advance_status}
                          advanceAmount={g.advance_amount}
                          pipelineStatus={g.pipeline_status}
                          onTap={() => router.push(`/gig/${g.id}`)}
                        />
                      ))}
                      {colGigs.length === 0 ? <Text style={styles.noGigsText}>No gigs in this stage</Text> : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: 10 },
  greeting: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textSecondary },
  djName: { fontFamily: FontFamily.sairaBold, fontSize: 24, color: Colors.textPrimary },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: 'rgba(24,200,230,0.34)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FontFamily.sairaBold, fontSize: 15, color: Colors.cyan },
  filterBar: { paddingVertical: 12 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.borderDefault },
  filterPillActive: { backgroundColor: Colors.cyan, borderColor: Colors.cyan },
  filterText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textTertiary },
  filterTextActive: { fontFamily: FontFamily.sairaSemiBold, fontSize: 12, color: Colors.textOnAccent },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, backgroundColor: Colors.amberDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amber },
  errorText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.amber, flex: 1 },
  listContainer: { paddingHorizontal: Layout.screenGutter, gap: 4 },
  listSectionHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  sectionDot: { width: 10, height: 10, borderRadius: 5 },
  sectionLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase', flex: 1 },
  listCards: { gap: 12, marginBottom: 8 },
  noGigsText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textDisabled, paddingLeft: 18, paddingBottom: 4 },
  countBadge: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.textSecondary },
  tonightSection: { marginBottom: 4 },
  tonightHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  tonightDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.cyan },
  tonightLabel: { fontFamily: FontFamily.monoMedium, fontSize: 11, letterSpacing: 1.6, color: Colors.cyan, textTransform: 'uppercase', flex: 1 },
  tonightCard: { borderColor: Colors.cyan, borderWidth: 1.5 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: FontFamily.sairaBold, fontSize: 21, color: Colors.textPrimary },
  emptySubtext: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary },
  emptyBtn: { backgroundColor: Colors.cyan, borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 14, marginTop: 16 },
  emptyBtnText: { fontFamily: FontFamily.sairaBold, fontSize: 15, color: Colors.textOnAccent },
});
