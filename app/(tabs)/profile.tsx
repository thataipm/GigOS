// GigOS Profile — Artist card (marketplace-ready)
import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getDJData, uploadAvatar, type DJProfile, type Gig } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { SectionLabel } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

const GIG_TYPE_LABELS: Record<string, string> = {
  club_night: 'Club Night', residency: 'Residency', private_party: 'Private',
  festival: 'Festival', corporate: 'Corporate', brand_activation: 'Brand',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(async () => {
    try {
      const { profile: p, gigs: g } = await getDJData();
      setProfile(p); setGigs(g); setError('');
    } catch {
      setError('Could not load profile. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow GigOS to access your photos to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadAvatar(result.assets[0].uri);
      if (url) setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Check your connection.');
    }
    setUploadingPhoto(false);
  };

  const gigCount = gigs.length;
  const venues = [...new Set(gigs.map(g => g.venue_name).filter(Boolean))];
  const initials = (profile?.name || 'DJ').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const currSymbol = profile?.currency === 'USD' ? '$' : '₹';
  const earned = gigs
    .filter(g => ['advance_received', 'done', 'paid'].includes(g.pipeline_status))
    .reduce((sum, g) => sum + (g.fee || 0), 0);
  const earnedDisplay = earned === 0 ? '—'
    : earned >= 10000000 ? `${currSymbol}${(earned / 10000000).toFixed(1)}Cr`
    : earned >= 100000  ? `${currSymbol}${(earned / 100000).toFixed(1)}L`
    : earned >= 1000    ? `${currSymbol}${(earned / 1000).toFixed(0)}K`
    : `${currSymbol}${earned}`;
  const isEstablished = gigCount >= 5;
  const artistLabel = (profile?.artist_type || 'dj').replace(/_/g, ' ').toUpperCase();

  const completenessItems = profile ? [
    { key: 'photo',   label: 'Add a profile photo',   done: !!profile.avatar_url,                                      onPress: handleChangePhoto },
    { key: 'bio',     label: 'Write a short bio',      done: !!profile.bio,                                             onPress: () => router.push('/settings') },
    { key: 'location',label: 'Add your city',          done: !!profile.city,                                            onPress: () => router.push('/settings') },
    { key: 'genres',  label: 'Select your genres',     done: (profile.genres?.length ?? 0) > 0,                         onPress: () => router.push('/settings') },
    { key: 'rate',    label: 'Set your rate range',    done: !!(profile.preferred_rate_min || profile.preferred_rate_max), onPress: () => router.push('/settings') },
    { key: 'gig',     label: 'Log your first gig',     done: gigCount > 0,                                              onPress: () => router.push('/(tabs)/add-gig') },
  ] : [];
  const completionScore = completenessItems.length
    ? Math.round(completenessItems.filter(i => i.done).length / completenessItems.length * 100)
    : 0;
  const missingItems = completenessItems.filter(i => !i.done);
  const progressColor = completionScore >= 70 ? Colors.cyan : completionScore >= 40 ? Colors.amber : Colors.red;

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
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <MaterialIcons name="settings" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={16} color={Colors.amber} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarWrap} disabled={uploadingPhoto}>
            {profile.avatar_url
              ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              : <View style={styles.avatarFallback}><Text style={styles.initials}>{initials}</Text></View>
            }
            <View style={styles.cameraBtn}>
              {uploadingPhoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialIcons name="camera-alt" size={13} color="#fff" />
              }
            </View>
          </TouchableOpacity>

          <Text style={styles.djName}>{profile.name}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.artistBadge}>
              <Text style={styles.artistBadgeText}>{artistLabel}</Text>
            </View>
            {isEstablished ? (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="stars" size={12} color={Colors.cyan} />
                <Text style={styles.verifiedText}>Established</Text>
              </View>
            ) : null}
          </View>

          {(profile.city || profile.country) ? (
            <Text style={styles.location}>
              {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
            </Text>
          ) : null}

          {profile.genres?.length ? (
            <View style={styles.genreRow}>
              {profile.genres.map(g => (
                <View key={g} style={styles.genreChip}>
                  <Text style={styles.genreChipText}>{g}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <TouchableOpacity onPress={() => router.push('/settings')} style={{ marginTop: 10 }}>
              <Text style={styles.addBioText}>+ Add a bio</Text>
            </TouchableOpacity>
          )}

          {(profile.soundcloud_url || profile.instagram_handle) ? (
            <View style={styles.socialRow}>
              {profile.soundcloud_url ? (
                <View style={styles.socialChip}>
                  <MaterialIcons name="headset" size={12} color={Colors.textTertiary} />
                  <Text style={styles.socialChipText}>SoundCloud</Text>
                </View>
              ) : null}
              {profile.instagram_handle ? (
                <View style={styles.socialChip}>
                  <MaterialIcons name="photo-camera" size={12} color={Colors.textTertiary} />
                  <Text style={styles.socialChipText}>@{profile.instagram_handle.replace('@', '')}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Completeness card ── */}
        {completionScore < 100 ? (
          <View style={styles.completenessCard}>
            <View style={styles.completenessHeader}>
              <Text style={styles.completenessTitle}>Profile Readiness</Text>
              <Text style={[styles.completenessScore, { color: progressColor }]}>{completionScore}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completionScore}%` as any, backgroundColor: progressColor }]} />
            </View>
            <Text style={styles.completenessHint}>
              {missingItems.length === 1
                ? 'One more step to a complete profile'
                : `${missingItems.length} items left to finish your profile`}
            </Text>
            {missingItems.map(item => (
              <TouchableOpacity key={item.key} style={styles.missingRow} onPress={item.onPress}>
                <View style={styles.missingDot} />
                <Text style={styles.missingLabel}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={16} color={Colors.textDisabled} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.completeCard}>
            <MaterialIcons name="check-circle" size={16} color={Colors.cyan} />
            <Text style={styles.completeText}>Profile complete</Text>
          </View>
        )}

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{gigCount}</Text>
            <Text style={styles.statLabel}>GIGS</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { fontSize: earned === 0 ? 28 : earnedDisplay.length > 5 ? 20 : 28 }]}>{earnedDisplay}</Text>
            <Text style={styles.statLabel}>EARNED</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{venues.length}</Text>
            <Text style={styles.statLabel}>VENUES</Text>
          </View>
        </View>

        {/* ── Rate Range ── */}
        {(profile.preferred_rate_min || profile.preferred_rate_max) ? (
          <View style={styles.section}>
            <SectionLabel>RATE RANGE</SectionLabel>
            <View style={styles.rateCard}>
              <Text style={styles.rateText}>
                {profile.currency === 'USD' ? '$' : '₹'}{profile.preferred_rate_min?.toLocaleString() ?? '—'}
                {'  —  '}
                {profile.currency === 'USD' ? '$' : '₹'}{profile.preferred_rate_max?.toLocaleString() ?? '—'}
              </Text>
              <Text style={styles.ratePerGig}>per gig</Text>
            </View>
          </View>
        ) : null}

        {/* ── Venues ── */}
        {venues.length > 0 ? (
          <View style={styles.section}>
            <SectionLabel>VENUES PLAYED</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
              {venues.map(v => {
                const count = gigs.filter(g => g.venue_name === v).length;
                const city = gigs.find(g => g.venue_name === v)?.venue_city;
                return (
                  <View key={v} style={styles.venueChip}>
                    <Text style={styles.venueChipName}>{v}</Text>
                    {city ? <Text style={styles.venueChipCity}>{city}</Text> : null}
                    <Text style={styles.venueChipCount}>{count}×</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* ── Gig History ── */}
        <View style={styles.section}>
          <SectionLabel>GIG HISTORY</SectionLabel>
          {gigCount === 0 ? (
            <View style={styles.emptyGigs}>
              <Text style={styles.emptyText}>No gigs logged yet.</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/add-gig')} style={styles.addGigBtn}>
                <Text style={styles.addGigBtnText}>ADD YOUR FIRST GIG</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.gigList}>
                {gigs.slice(0, 5).map((g, idx) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.gigRow, idx === Math.min(gigs.length, 5) - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => router.push(`/gig/${g.id}`)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gigName} numberOfLines={1}>{g.event_name}</Text>
                      <Text style={styles.gigMeta}>
                        {new Date(g.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {g.venue_name ? ` · ${g.venue_name}` : ''}
                      </Text>
                    </View>
                    <View style={styles.gigTypeChip}>
                      <Text style={styles.gigTypeText}>{GIG_TYPE_LABELS[g.gig_type] || g.gig_type}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              {gigCount > 5 ? (
                <TouchableOpacity onPress={() => router.push('/(tabs)/pipeline')} style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>See all {gigCount} gigs in pipeline →</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },

  // Hero
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 24, paddingHorizontal: Layout.screenGutter, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: Colors.cyan },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.surfaceCard, borderWidth: 2, borderColor: Colors.cyan, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: FontFamily.sairaBold, fontSize: 32, color: Colors.cyan },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.cyan, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.surfaceRaised },

  djName: { fontFamily: FontFamily.sairaBold, fontSize: 26, color: Colors.textPrimary, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  artistBadge: { backgroundColor: 'rgba(24,200,230,0.12)', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(24,200,230,0.4)' },
  artistBadgeText: { fontFamily: FontFamily.sairaBold, fontSize: 11, color: Colors.cyan, letterSpacing: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.pill, backgroundColor: 'rgba(24,200,230,0.06)', borderWidth: 1, borderColor: 'rgba(24,200,230,0.25)' },
  verifiedText: { fontFamily: FontFamily.monoMedium, fontSize: 10, color: Colors.cyan },

  location: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary, marginTop: 8, textAlign: 'center' },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, justifyContent: 'center' },
  genreChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, borderWidth: 1, borderColor: 'rgba(24,200,230,0.30)', backgroundColor: 'rgba(24,200,230,0.08)' },
  genreChipText: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.cyan, letterSpacing: 0.5 },
  bio: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary, marginTop: 12, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  addBioText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textDisabled },

  socialRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  socialChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.surfaceCard, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderDefault },
  socialChipText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textSecondary },

  // Completeness
  completenessCard: { marginHorizontal: Layout.screenGutter, marginTop: 12, backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, padding: 16 },
  completenessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completenessTitle: { fontFamily: FontFamily.sairaSemiBold, fontSize: 14, color: Colors.textPrimary },
  completenessScore: { fontFamily: FontFamily.sairaBold, fontSize: 18 },
  progressTrack: { height: 5, backgroundColor: Colors.surfaceInput, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  completenessHint: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textTertiary, marginBottom: 4, lineHeight: 18 },
  missingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  missingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textDisabled },
  missingLabel: { flex: 1, fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textPrimary },
  completeCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Layout.screenGutter, marginTop: 12, backgroundColor: 'rgba(24,200,230,0.06)', borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(24,200,230,0.2)', padding: 12 },
  completeText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.cyan },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Layout.screenGutter, paddingVertical: 12 },
  statTile: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: FontFamily.sairaBold, fontSize: 28, color: Colors.textPrimary },
  statLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1, color: Colors.textTertiary, textTransform: 'uppercase' },

  // Sections
  section: { paddingHorizontal: Layout.screenGutter, marginTop: 20 },

  // Rate
  rateCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 16, paddingVertical: 14, marginTop: 8 },
  rateText: { fontFamily: FontFamily.sairaBold, fontSize: 20, color: Colors.textPrimary },
  ratePerGig: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textTertiary },

  // Venues
  venueChip: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 12, paddingVertical: 10, gap: 2, minWidth: 100 },
  venueChipName: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textPrimary },
  venueChipCity: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary },
  venueChipCount: { fontFamily: FontFamily.monoMedium, fontSize: 10, color: Colors.cyan, marginTop: 2 },

  // Gigs
  gigList: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, overflow: 'hidden', marginTop: 8 },
  gigRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: 12 },
  gigName: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textPrimary },
  gigMeta: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  gigTypeChip: { backgroundColor: Colors.surfaceInput, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  gigTypeText: { fontFamily: FontFamily.plexRegular, fontSize: 10, color: Colors.textTertiary },
  seeAllBtn: { alignItems: 'center', paddingVertical: 12 },
  seeAllText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.cyan },

  emptyGigs: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  emptyText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary },
  addGigBtn: { borderWidth: 1, borderColor: Colors.cyan, borderRadius: Radius.md, paddingHorizontal: 20, paddingVertical: 10 },
  addGigBtnText: { fontFamily: FontFamily.sairaBold, fontSize: 13, color: Colors.cyan },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, backgroundColor: Colors.amberDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amber },
  errorBannerText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.amber, flex: 1 },
});
