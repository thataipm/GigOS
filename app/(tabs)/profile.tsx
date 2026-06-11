// GigOS Profile — Always accessible, no lock
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDJData, type DJProfile, type Gig } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { SectionLabel, CurrencyText, GigCard } from '@/src/components';
import { Glow } from '@/src/theme/effects';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { profile: p, gigs: g } = await getDJData();
      setProfile(p); setGigs(g);
      setError('');
    } catch {
      setError('Could not load profile. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const gigCount = gigs.length;
  const venues = [...new Set(gigs.map(g => g.venue_name).filter(Boolean))];
  const cities = [...new Set(gigs.map(g => g.venue_city).filter(Boolean))];
  const initials = (profile?.name || 'DJ').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (loading) return (
    <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator color={Colors.cyan} size="large" />
    </View>
  );

  if (!profile) return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Text style={styles.navTitle}>Profile</Text>
      </View>
      {error ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="wifi-off" size={16} color={Colors.amber} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <Text style={styles.navTitle}>Profile</Text>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <TouchableOpacity testID="nudge-btn" onPress={() => router.push('/nudge')}><MaterialIcons name="notifications-none" size={22} color={Colors.textSecondary} /></TouchableOpacity>
          <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')}><MaterialIcons name="settings" size={22} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={16} color={Colors.amber} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.avatarLg, Glow.cyan]}><Text style={styles.avatarLgText}>{initials}</Text></View>
          <Text style={styles.djNameLg}>{profile.name}</Text>
          <Text style={styles.cityText}>{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}{profile.genres?.length ? ` · ${profile.genres.join(', ')}` : ''}</Text>
          {gigCount >= 5 ? (
            <View style={styles.verifiedRow}><MaterialIcons name="verified" size={16} color={Colors.cyan} /><Text style={styles.verifiedText}>Verified on GigOS</Text></View>
          ) : null}
          {profile.genres?.length ? (
            <View style={styles.genreRow}>{profile.genres.map(g => (<View key={g} style={styles.genreTag}><Text style={styles.genreTagText}>{g}</Text></View>))}</View>
          ) : null}
          <View style={styles.socialRow}>
            {profile.soundcloud_url ? <TouchableOpacity onPress={() => Linking.openURL(profile.soundcloud_url!)}><Text style={styles.socialLink}>SoundCloud</Text></TouchableOpacity> : null}
            {profile.instagram_handle ? <TouchableOpacity onPress={() => Linking.openURL(`https://instagram.com/${profile.instagram_handle!.replace('@', '')}`)}><Text style={styles.socialLink}>@{profile.instagram_handle?.replace('@', '')}</Text></TouchableOpacity> : null}
          </View>
        </View>

        {/* Stats — always show */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}><Text style={styles.statValue}>{gigCount}</Text><Text style={styles.statLabel}>GIGS</Text></View>
          <View style={styles.statTile}><Text style={styles.statValue}>{cities.length}</Text><Text style={styles.statLabel}>CITIES</Text></View>
          <View style={styles.statTile}><Text style={styles.statValue}>{venues.length}</Text><Text style={styles.statLabel}>VENUES</Text></View>
        </View>

        {/* Venues */}
        <View style={{ paddingHorizontal: Layout.screenGutter, marginTop: 16 }}><SectionLabel>VENUES PLAYED</SectionLabel></View>
        {venues.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Layout.screenGutter, gap: 10, paddingVertical: 8 }}>
            {venues.map(v => {
              const count = gigs.filter(g => g.venue_name === v).length;
              const city = gigs.find(g => g.venue_name === v)?.venue_city;
              return (<View key={v} style={styles.venueCard}><Text style={styles.venueName}>{v}</Text><Text style={styles.venueCity}>{city}</Text><Text style={styles.venueCount}>{count} gig{count !== 1 ? 's' : ''}</Text></View>);
            })}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>Venues appear as you log gigs.</Text>
        )}

        {/* Gig History */}
        <View style={{ paddingHorizontal: Layout.screenGutter, marginTop: 16 }}><SectionLabel>GIG HISTORY</SectionLabel></View>
        {gigCount === 0 ? (
          <View style={styles.emptyGigs}>
            <Text style={styles.emptyGigsText}>No gigs logged yet.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/add-gig')} style={styles.addGigGhost}><Text style={styles.addGigGhostText}>ADD YOUR FIRST GIG</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gigHistoryList}>
            {gigs.slice(0, 5).map(g => (
              <GigCard
                key={g.id}
                gigName={g.event_name}
                date={g.date}
                venueName={g.venue_name}
                gigType={g.gig_type}
                fee={g.fee}
                currency={profile?.currency || 'INR'}
                advanceStatus={g.advance_status}
                advanceAmount={g.advance_amount}
                pipelineStatus={g.pipeline_status}
                onTap={() => router.push(`/gig/${g.id}`)}
              />
            ))}
            {gigCount > 5 ? (
              <TouchableOpacity onPress={() => router.push('/(tabs)/pipeline')} style={styles.showAllBtn}>
                <Text style={styles.showAllText}>See all {gigCount} gigs in pipeline →</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Rate Range */}
        {profile.preferred_rate_min || profile.preferred_rate_max ? (
          <View style={{ paddingHorizontal: Layout.screenGutter, marginTop: 16 }}>
            <SectionLabel>RATE RANGE</SectionLabel>
            <View style={styles.rateCard}>
              <CurrencyText amount={profile.preferred_rate_min} currency={profile.currency} fontSize={21} />
              <Text style={styles.rateDash}> — </Text>
              <CurrencyText amount={profile.preferred_rate_max} currency={profile.currency} fontSize={21} />
            </View>
          </View>
        ) : null}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  heroSection: { alignItems: 'center', padding: 20, backgroundColor: Colors.surfaceRaised },
  avatarLg: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surfaceCard, borderWidth: 2, borderColor: Colors.cyan, alignItems: 'center', justifyContent: 'center' },
  avatarLgText: { fontFamily: FontFamily.sairaBold, fontSize: 28, color: Colors.cyan },
  djNameLg: { fontFamily: FontFamily.sairaBold, fontSize: 26, color: Colors.textPrimary, marginTop: 12 },
  cityText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  verifiedText: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.cyan },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'center' },
  genreTag: { backgroundColor: 'rgba(24,200,230,0.12)', borderWidth: 1, borderColor: 'rgba(24,200,230,0.34)', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  genreTagText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.cyan },
  socialRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  socialLink: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Layout.screenGutter, paddingVertical: 12 },
  statTile: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: FontFamily.sairaBold, fontSize: 28, color: Colors.textPrimary },
  statLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1, color: Colors.textTertiary, textTransform: 'uppercase' },
  venueCard: { width: 140, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, padding: 12, gap: 2 },
  venueName: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textPrimary },
  venueCity: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary },
  venueCount: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.cyan, marginTop: 4 },
  emptyText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary, paddingHorizontal: Layout.screenGutter, paddingTop: 8 },
  emptyGigs: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  emptyGigsText: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary },
  addGigGhost: { borderWidth: 1, borderColor: Colors.cyan, borderRadius: Radius.md, paddingHorizontal: 20, paddingVertical: 10 },
  addGigGhostText: { fontFamily: FontFamily.sairaBold, fontSize: 13, color: Colors.cyan },
  rateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, padding: 14, marginTop: 8 },
  rateDash: { fontFamily: FontFamily.plexRegular, fontSize: 21, color: Colors.textTertiary },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, backgroundColor: Colors.amberDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amber },
  errorBannerText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.amber, flex: 1 },
  gigHistoryList: { paddingHorizontal: Layout.screenGutter, gap: 12, marginTop: 8 },
  showAllBtn: { alignItems: 'center', paddingVertical: 12 },
  showAllText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.cyan },
});
