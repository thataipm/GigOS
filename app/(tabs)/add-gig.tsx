// GigOS Add Gig Form — With venue quick-pick, LocationPicker + DateField
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDJData, createGig } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { GigOSInput, PrimaryButton, SectionLabel, TagGrid, SegmentedControl, LocationPicker, DateField } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

const GIG_TYPES = ['Club Night', 'Residency', 'Private Party', 'Festival', 'Corporate', 'Brand Activation'];
const GIG_TYPE_MAP: Record<string, string> = { 'Club Night': 'club_night', 'Residency': 'residency', 'Private Party': 'private_party', 'Festival': 'festival', 'Corporate': 'corporate', 'Brand Activation': 'brand_activation' };
const ADV_OPTIONS = ['Not Requested', 'Requested', 'Received', 'Waived'];
const ADV_MAP: Record<string, string> = { 'Not Requested': 'not_requested', 'Requested': 'requested', 'Received': 'received', 'Waived': 'waived' };

type RecentVenue = { name: string; city: string | null; state: string | null; country: string | null };

export default function AddGigScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currency, setCurrency] = useState('INR');
  const [recentVenues, setRecentVenues] = useState<RecentVenue[]>([]);
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueCountry, setVenueCountry] = useState('India');
  const [venueState, setVenueState] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [gigType, setGigType] = useState('Club Night');
  const [fee, setFee] = useState('');
  const [advanceAmt, setAdvanceAmt] = useState('');
  const [advanceStatus, setAdvanceStatus] = useState('Not Requested');
  const [promoterName, setPromoterName] = useState('');
  const [promoterPhone, setPromoterPhone] = useState('');
  const [genre, setGenre] = useState('');
  const [riderNotes, setRiderNotes] = useState('');
  const [travelNotes, setTravelNotes] = useState('');
  const [soundEngineer, setSoundEngineer] = useState('');
  const [showLogistics, setShowLogistics] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showPromoter, setShowPromoter] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState('');
  const [existingGigs, setExistingGigs] = useState<{ date: string; event_name: string }[]>([]);

  const resetForm = useCallback(() => {
    setEventName(''); setDate(''); setVenueName(''); setVenueCity('');
    setVenueState(''); setVenueCountry('India'); setGigType('Club Night');
    setFee(''); setAdvanceAmt(''); setAdvanceStatus('Not Requested');
    setPromoterName(''); setPromoterPhone(''); setGenre('');
    setRiderNotes(''); setTravelNotes(''); setSoundEngineer('');
    setShowLogistics(false); setShowLocation(false); setShowPromoter(false);
    setErrors({}); setConflictWarning('');
  }, []);

  useFocusEffect(useCallback(() => {
    resetForm();
    getDJData().then(({ profile: p, gigs }) => {
      if (p) setCurrency(p.currency);
      setExistingGigs(gigs.map(g => ({ date: g.date, event_name: g.event_name })));
      const seen = new Set<string>();
      const venues: RecentVenue[] = [];
      for (const g of gigs) {
        if (g.venue_name && !seen.has(g.venue_name)) {
          seen.add(g.venue_name);
          venues.push({ name: g.venue_name, city: g.venue_city, state: g.venue_state, country: g.venue_country });
          if (venues.length >= 6) break;
        }
      }
      setRecentVenues(venues);
    });
  }, [resetForm]));

  const handleDateChange = (d: string) => {
    setDate(d);
    const conflict = existingGigs.find(g => g.date === d);
    setConflictWarning(conflict ? `⚠️ You already have "${conflict.event_name}" on this date.` : '');
  };

  const sym = currency === 'USD' ? '$' : '₹';
  const balance = (parseInt(fee || '0') || 0) - (parseInt(advanceAmt || '0') || 0);

  const applyRecentVenue = (v: RecentVenue) => {
    setVenueName(v.name);
    setVenueCity(v.city || '');
    setVenueState(v.state || '');
    setVenueCountry(v.country || 'India');
    setShowLocation(true);
  };

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!eventName) e.eventName = 'Required';
    if (!date) e.date = 'Required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      await createGig({
        event_name: eventName, date,
        venue_name: venueName || null,
        venue_country: venueCountry || null, venue_state: venueState || null, venue_city: venueCity || null,
        gig_type: GIG_TYPE_MAP[gigType] || 'club_night', pipeline_status: 'enquiry',
        fee: fee ? parseInt(fee) : null, advance_amount: advanceAmt ? parseInt(advanceAmt) : null,
        advance_status: ADV_MAP[advanceStatus] || 'not_requested',
        balance_status: 'pending',
        promoter_name: promoterName || null, promoter_phone: promoterPhone || null,
        genre: genre || null, rider_notes: riderNotes || null, travel_notes: travelNotes || null,
        sound_engineer: soundEngineer || null, is_public: false,
      });
      // Notifications are scheduled when the user first opens the gig detail screen
      router.back();
    } catch {
      setErrors({ save: 'Failed to save gig. Check your connection.' });
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Nav */}
      <View style={[styles.nav, { paddingTop: insets.top }]}>
        <TouchableOpacity testID="close-add-gig" onPress={() => router.back()}>
          <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Gig</Text>
        <TouchableOpacity testID="save-gig-btn" onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Prominent page heading */}
        <Text style={styles.pageHeading}>Log a Booking</Text>
        <Text style={styles.pageSubtext}>Fill in the details — only event name and date are required.</Text>

        {/* ─── THE GIG ─── */}
        <View style={styles.sectionBlock}>
          <SectionLabel>THE GIG</SectionLabel>
          <GigOSInput label="EVENT NAME" value={eventName} onChangeText={setEventName} placeholder="e.g. TRYST Saturday" error={errors.eventName} />
          <View style={{ marginTop: 16 }}>
            <DateField label="DATE" value={date} onChange={handleDateChange} error={errors.date} placeholder="Select gig date" />
          </View>
          {conflictWarning ? (
            <View style={styles.conflictBanner}>
              <MaterialIcons name="warning" size={14} color={Colors.amber} />
              <Text style={styles.conflictText}>{conflictWarning}</Text>
            </View>
          ) : null}

          <GigOSInput label="VENUE NAME" value={venueName} onChangeText={setVenueName} placeholder="e.g. Kitty Su" containerStyle={{ marginTop: 16 }} />

          {/* Recent venues quick-pick */}
          {recentVenues.length > 0 ? (
            <View style={styles.recentVenueRow}>
              <Text style={styles.recentLabel}>RECENT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {recentVenues.map(v => (
                  <TouchableOpacity key={v.name} onPress={() => applyRecentVenue(v)} style={styles.recentChip}>
                    <MaterialIcons name="history" size={12} color={Colors.cyan} />
                    <Text style={styles.recentChipText}>{v.name}{v.city ? `, ${v.city}` : ''}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Collapsible venue location */}
          <TouchableOpacity onPress={() => setShowLocation(!showLocation)} style={styles.locationToggle}>
            <MaterialIcons name="place" size={16} color={Colors.cyan} />
            <Text style={styles.locationToggleText}>
              {showLocation ? 'Hide location' : venueCity ? `📍 ${venueCity}${venueState ? `, ${venueState}` : ''}` : 'Add venue location'}
            </Text>
            <MaterialIcons name={showLocation ? 'expand-less' : 'expand-more'} size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
          {showLocation ? (
            <LocationPicker country={venueCountry} state={venueState} city={venueCity} onChangeCountry={setVenueCountry} onChangeState={setVenueState} onChangeCity={setVenueCity} />
          ) : null}

          <View style={{ marginTop: 16 }}>
            <TagGrid options={GIG_TYPES} selected={[gigType]} onToggle={setGigType} label="GIG TYPE" single />
          </View>
        </View>

        {/* ─── MONEY ─── */}
        <View style={styles.sectionBlock}>
          <SectionLabel>MONEY</SectionLabel>
          <GigOSInput label="FEE AGREED" value={fee} onChangeText={setFee} keyboardType="numeric" prefix={sym} placeholder={currency === 'USD' ? '500' : '45000'} />
          <GigOSInput label="ADVANCE AMOUNT" value={advanceAmt} onChangeText={setAdvanceAmt} keyboardType="numeric" prefix={sym} placeholder={currency === 'USD' ? '200' : '15000'} containerStyle={{ marginTop: 16 }} />
          {fee && advanceAmt ? <Text style={styles.balanceText}>Balance due: {sym}{balance.toLocaleString()}</Text> : null}
          <View style={{ marginTop: 16 }}>
            <SegmentedControl label="ADVANCE STATUS" options={ADV_OPTIONS} value={advanceStatus} onChange={setAdvanceStatus} />
          </View>
        </View>

        {/* ─── PROMOTER (collapsible) ─── */}
        <TouchableOpacity onPress={() => setShowPromoter(!showPromoter)} style={styles.collapseHeader}>
          <SectionLabel>PROMOTER</SectionLabel>
          <MaterialIcons name={showPromoter ? 'expand-less' : 'expand-more'} size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
        {showPromoter ? (
          <View style={[styles.sectionBlock, { gap: 16 }]}>
            <GigOSInput label="PROMOTER NAME" value={promoterName} onChangeText={setPromoterName} placeholder="Mihir Shah, Priya Events..." />
            <GigOSInput label="PROMOTER PHONE" value={promoterPhone} onChangeText={setPromoterPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
          </View>
        ) : null}

        {/* ─── LOGISTICS (collapsible) ─── */}
        <TouchableOpacity onPress={() => setShowLogistics(!showLogistics)} style={styles.collapseHeader}>
          <SectionLabel>LOGISTICS</SectionLabel>
          <MaterialIcons name={showLogistics ? 'expand-less' : 'expand-more'} size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
        {showLogistics ? (
          <View style={[styles.sectionBlock, { gap: 16 }]}>
            <GigOSInput label="GENRE" value={genre} onChangeText={setGenre} placeholder="Techno, House..." />
            <GigOSInput label="SOUND ENGINEER" value={soundEngineer} onChangeText={setSoundEngineer} placeholder="Name" />
            <GigOSInput label="RIDER NOTES" value={riderNotes} onChangeText={setRiderNotes} placeholder="CDJ-3000, DJM-900..." multiline numberOfLines={3} />
            <GigOSInput label="TRAVEL NOTES" value={travelNotes} onChangeText={setTravelNotes} placeholder="Flight details..." multiline numberOfLines={3} />
          </View>
        ) : null}

        {errors.save ? <Text style={styles.errorText}>{errors.save}</Text> : null}
        <PrimaryButton title="SAVE GIG" onPress={handleSave} loading={loading} style={{ marginTop: 24 }} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingBottom: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  saveText: { fontFamily: FontFamily.sairaSemiBold, fontSize: 15, color: Colors.cyan },
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingTop: 20, paddingBottom: 40 },
  pageHeading: { fontFamily: FontFamily.sairaBold, fontSize: 26, color: Colors.textPrimary, marginBottom: 4 },
  pageSubtext: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textSecondary, marginBottom: 24, lineHeight: 20 },
  sectionBlock: { marginBottom: 24 },
  recentVenueRow: { marginTop: 10, gap: 6 },
  recentLabel: { fontFamily: FontFamily.monoMedium, fontSize: 9, letterSpacing: 1.4, color: Colors.textDisabled, textTransform: 'uppercase' },
  recentChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: 'rgba(24,200,230,0.08)', borderWidth: 1, borderColor: 'rgba(24,200,230,0.25)' },
  recentChipText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.cyan },
  locationToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 6 },
  locationToggleText: { flex: 1, fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.cyan },
  balanceText: { fontFamily: FontFamily.monoRegular, fontSize: 12, color: Colors.textSecondary, marginTop: 8 },
  collapseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  errorText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.red, marginTop: 8, textAlign: 'center' },
  conflictBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 10, backgroundColor: Colors.amberDim, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.amber },
  conflictText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.amber, flex: 1, lineHeight: 18 },
});
