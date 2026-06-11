// GigOS Follow-up Nudge Screen
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDJData, type Gig } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { PrimaryButton } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

type Nudge = { venue: string; promoterName: string; promoterPhone: string; weeksAgo: number; lastDate: string; };

const DISMISSED_KEY = 'nudge_dismissed';
const SNOOZED_KEY = 'nudge_snoozed';

export default function NudgeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    (async () => {
      // Load persisted dismiss/snooze state
      const rawDismissed = await AsyncStorage.getItem(DISMISSED_KEY);
      const rawSnoozed = await AsyncStorage.getItem(SNOOZED_KEY);
      if (rawDismissed) setDismissed(new Set(JSON.parse(rawDismissed)));
      if (rawSnoozed) setSnoozed(new Map(Object.entries(JSON.parse(rawSnoozed))));

      const { gigs } = await getDJData();
      const now = new Date();
      const venueMap: Record<string, Gig[]> = {};
      gigs.forEach(g => { if (g.venue_name) { (venueMap[g.venue_name] = venueMap[g.venue_name] || []).push(g); } });

      const result: Nudge[] = [];
      Object.entries(venueMap).forEach(([venue, vGigs]) => {
        const sorted = vGigs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sorted[0];
        const weeksAgo = Math.floor((now.getTime() - new Date(latest.date).getTime()) / (7 * 86400000));
        const hasFuture = vGigs.some(g => new Date(g.date) > now);
        if (weeksAgo >= 6 && !hasFuture && latest.promoter_name) {
          result.push({ venue, promoterName: latest.promoter_name, promoterPhone: latest.promoter_phone || '', weeksAgo, lastDate: latest.date });
        }
      });
      setNudges(result);
    })();
  }, []);

  const sendWhatsApp = (n: Nudge) => {
    const phone = n.promoterPhone.replace(/\s/g, '').replace('+', '');
    const msg = encodeURIComponent(`Hey ${n.promoterName}! 🎧\nIt was great playing at ${n.venue} last time — the energy was incredible.\nWould love to come back if you have dates open. Happy to chat whenever works for you! 🙏`);
    if (phone) Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  const snoozeVenue = async (venue: string) => {
    const until = Date.now() + 14 * 24 * 60 * 60 * 1000;
    const next = new Map(snoozed).set(venue, until);
    setSnoozed(next);
    const obj: Record<string, number> = {};
    next.forEach((v, k) => { obj[k] = v; });
    await AsyncStorage.setItem(SNOOZED_KEY, JSON.stringify(obj));
  };

  const dismissVenue = async (venue: string) => {
    const next = new Set([...dismissed, venue]);
    setDismissed(next);
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
  };

  const now = Date.now();
  const visible = nudges.filter(n => !dismissed.has(n.venue) && (!snoozed.has(n.venue) || (snoozed.get(n.venue) ?? 0) <= now));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Follow-up</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="notifications-none" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No follow-ups needed</Text>
            <Text style={styles.emptySub}>All venues are recently booked.</Text>
          </View>
        ) : visible.map(n => (
          <View key={n.venue} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.appIcon}><Text style={styles.appIconText}>G</Text></View>
              <Text style={styles.appLabel}>GigOS</Text>
              <Text style={styles.timeLabel}>{n.weeksAgo} weeks ago</Text>
            </View>
            <Text style={styles.cardTitle}>Time to follow up with {n.venue} 🔔</Text>
            <Text style={styles.cardBody}>You played there {n.weeksAgo} weeks ago and haven't been rebooked. Want to reach out to {n.promoterName}?</Text>

            {/* WhatsApp bubble */}
            <View style={styles.waBubble}>
              <Text style={styles.waTo}>💬 To: {n.promoterName} ({n.venue})</Text>
              <Text style={styles.waMsg}>Hey {n.promoterName}! 🎧{'\n'}It was great playing at {n.venue} last time — the energy was incredible.{'\n'}Would love to come back if you have dates open. Happy to chat whenever works for you! 🙏</Text>
            </View>

            <PrimaryButton title="💬 Send on WhatsApp" onPress={() => sendWhatsApp(n)} variant="whatsapp" style={{ marginTop: 12 }} />
            <View style={styles.secondaryRow}>
              <TouchableOpacity onPress={() => snoozeVenue(n.venue)} style={styles.ghostBtn}>
                <Text style={styles.ghostText}>Snooze 2 weeks</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => dismissVenue(n.venue)} style={styles.ghostBtn}>
                <Text style={styles.ghostText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingTop: 16, paddingBottom: 40, gap: 16 },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  appIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: Colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  appIconText: { fontFamily: FontFamily.sairaBold, fontSize: 14, color: Colors.cyan },
  appLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, color: Colors.textTertiary, flex: 1 },
  timeLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, color: Colors.textTertiary },
  cardTitle: { fontFamily: FontFamily.plexSemiBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  cardBody: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  waBubble: { backgroundColor: Colors.whatsAppBubbleBg, borderRadius: 16, borderWidth: 1, borderColor: Colors.whatsAppBubbleBorder, padding: 14, marginTop: 12 },
  waTo: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.whatsAppBubbleLabel, marginBottom: 6 },
  waMsg: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.whatsAppBubbleText, lineHeight: 23 },
  secondaryRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  ghostBtn: { flex: 1, height: 36, borderRadius: 8, borderWidth: 1, borderColor: Colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontFamily: FontFamily.sairaBold, fontSize: 21, color: Colors.textPrimary },
  emptySub: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary },
});
