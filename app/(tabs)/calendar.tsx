// GigOS Calendar — Monthly view with gig dots + bottom sheet
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDJData, type Gig } from '@/src/services/supabaseData';
import { Colors, StatusColors, StatusKey } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { GigCard } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DOT_COLORS: Record<string, string> = Object.fromEntries(
  ['enquiry', 'confirmed', 'advance_received', 'done', 'paid'].map(k => [k, StatusColors[k as StatusKey]?.fg ?? Colors.textTertiary])
);

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

function formatSheetDate(y: number, m: number, d: number): string {
  return new Date(y, m, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [currency, setCurrency] = useState('INR');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [sheetDate, setSheetDate] = useState<number | null>(null);
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
      setError('Could not load calendar. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const gigsByDate: Record<string, Gig[]> = {};
  gigs.forEach(g => {
    const d = new Date(g.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const key = d.getDate().toString();
      (gigsByDate[key] = gigsByDate[key] || []).push(g);
    }
  });

  const sheetGigs = sheetDate ? (gigsByDate[sheetDate.toString()] || []) : [];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={prevMonth}><MaterialIcons name="chevron-left" size={28} color={Colors.textSecondary} /></TouchableOpacity>
        <Text style={styles.navTitle}>{monthName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity onPress={() => router.push('/nudge')} style={{ paddingHorizontal: 4 }}>
            <MaterialIcons name="notifications-none" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth}><MaterialIcons name="chevron-right" size={28} color={Colors.textSecondary} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}>
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={16} color={Colors.amber} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={Colors.cyan} size="large" /></View>
        ) : (
          <>
        <View style={styles.dayHeaderRow}>
          {DAYS.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`e-${i}`} style={styles.cell} />;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dayGigs = gigsByDate[day.toString()] || [];
            return (
              <TouchableOpacity key={day} onPress={() => dayGigs.length > 0 ? setSheetDate(day) : null} activeOpacity={dayGigs.length > 0 ? 0.6 : 1} style={styles.cell}>
                <View style={[styles.dateCircle, isToday && styles.dateToday]}>
                  <Text style={[styles.dateText, isToday && styles.dateTodayText]}>{day}</Text>
                </View>
                <View style={styles.dotsRow}>
                  {dayGigs.slice(0, 3).map((g, j) => (
                    <View key={j} style={[styles.dot, { backgroundColor: DOT_COLORS[g.pipeline_status] || Colors.textTertiary }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>

      {/* Bottom Sheet for selected date */}
      <Modal visible={sheetDate !== null} transparent animationType="slide" onRequestClose={() => setSheetDate(null)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setSheetDate(null)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{sheetDate ? formatSheetDate(year, month, sheetDate) : ''}</Text>
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingBottom: 20 }}>
              {sheetGigs.map(g => (
                <GigCard key={g.id} gigName={g.event_name} date={g.date} venueName={g.venue_name} gigType={g.gig_type} fee={g.fee} currency={currency} advanceStatus={g.advance_status} advanceAmount={g.advance_amount} pipelineStatus={g.pipeline_status} onTap={() => { setSheetDate(null); router.push(`/gig/${g.id}`); }} />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  dayHeaderRow: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 12, paddingBottom: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1, color: Colors.textTertiary, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  cell: { width: '14.28%', height: 56, alignItems: 'center', paddingTop: 4 },
  dateCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dateToday: { backgroundColor: Colors.cyan },
  dateText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textPrimary },
  dateTodayText: { color: Colors.textOnAccent },
  dotsRow: { flexDirection: 'row', gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  // Bottom Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surfaceRaised, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.graphite500, alignSelf: 'center', marginTop: 10 },
  sheetTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary, padding: 16, paddingHorizontal: 20 },
  loadingWrap: { paddingTop: 80, alignItems: 'center' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, backgroundColor: Colors.amberDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amber },
  errorText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.amber, flex: 1 },
});
