// GigOS Onboarding — 3-step flow
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { getDJProfile, createGig } from '@/src/services/supabaseData';
import { storage } from '@/src/utils/storage';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Space, Layout, Radius } from '@/src/theme/spacing';
import { Glow } from '@/src/theme/effects';
import { GigOSInput, PrimaryButton, SectionLabel, TagGrid, GigCard, DateField } from '@/src/components';

const GENRES = ['Techno', 'House', 'Psytrance', 'DnB', 'Bollywood', 'Bollytech', 'Commercial', 'Hip-Hop'];
const GIG_TYPES = ['club_night', 'residency', 'private_party', 'festival', 'corporate', 'brand_activation'];
const GIG_TYPE_LABELS: Record<string, string> = { club_night: 'Club Night', residency: 'Residency', private_party: 'Private', festival: 'Festival', corporate: 'Corporate', brand_activation: 'Brand' };

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [djName, setDjName] = useState('');
  const [currency, setCurrency] = useState('INR');
  // Step 1
  const [genres, setGenres] = useState<string[]>([]);
  const [soundcloud, setSoundcloud] = useState('');
  const [instagram, setInstagram] = useState('');
  // Step 2
  const [eventName, setEventName] = useState('');
  const [gigDate, setGigDate] = useState('');
  const [venue, setVenue] = useState('');
  const [gigType, setGigType] = useState('club_night');
  const [fee, setFee] = useState('');
  const [advance, setAdvance] = useState('');
  const [createdGig, setCreatedGig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step2Error, setStep2Error] = useState('');

  useEffect(() => {
    (async () => {
      const profile = await getDJProfile();
      if (profile) { setDjName(profile.name); setCurrency(profile.currency); }
    })();
  }, []);

  const toggleGenre = (g: string) => {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const saveStep1 = async () => {
    if (user) {
      await supabase.from('djs').update({
        genres, soundcloud_url: soundcloud || null, instagram_handle: instagram || null,
      }).eq('user_id', user.id);
    }
    setStep(2);
  };

  const saveStep2 = async () => {
    if (!eventName && !gigDate) { setStep(3); return; } // both blank = user skipping
    if (eventName && !gigDate) { setStep2Error('Please select the gig date.'); return; }
    if (!eventName && gigDate) { setStep2Error('Please enter the event name.'); return; }
    setStep2Error('');
    setLoading(true);
    try {
      const gig = await createGig({
        event_name: eventName, date: gigDate, venue_name: venue || null,
        gig_type: gigType, fee: fee ? parseInt(fee) : null,
        advance_amount: advance ? parseInt(advance) : null,
        advance_status: advance ? 'requested' : 'not_requested',
        pipeline_status: 'enquiry',
      });
      setCreatedGig(gig);
    } catch (e) { setStep2Error('Failed to save gig. Try again.'); setLoading(false); return; }
    setLoading(false);
    setStep(3);
  };

  const finish = async () => {
    // Write to DB so it survives reinstalls / new devices
    if (user) {
      await supabase.from('djs').update({ onboarding_complete: true }).eq('user_id', user.id);
    }
    await storage.setItem('onboarding_complete', true); // local cache for fast reads
    router.replace('/(tabs)/pipeline');
  };

  const firstName = djName.split(' ').pop() || djName;

  // Step dots
  const Dots = () => (
    <View style={styles.dots}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.dot, step === i ? styles.dotActive : styles.dotInactive]} />
      ))}
    </View>
  );

  if (step === 1) return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Dots />
      <Text style={styles.heading}>Welcome, {firstName}</Text>
      <Text style={styles.subtext}>Tell us what you play.</Text>
      <View style={{ marginTop: 24 }}>
        <TagGrid options={GENRES} selected={genres} onToggle={toggleGenre} label="GENRES" />
      </View>
      <GigOSInput label="SOUNDCLOUD / MIXCLOUD" value={soundcloud} onChangeText={setSoundcloud} placeholder="soundcloud.com/yourname" containerStyle={{ marginTop: 24 }} />
      <GigOSInput label="INSTAGRAM" value={instagram} onChangeText={setInstagram} placeholder="yourhandle" prefix="@" containerStyle={{ marginTop: 16 }} />
      <PrimaryButton title="NEXT →" onPress={saveStep1} style={{ marginTop: 32 }} />
      <TouchableOpacity onPress={() => setStep(2)} style={styles.skipBtn}><Text style={styles.skipText}>Skip for now</Text></TouchableOpacity>
    </ScrollView>
  );

  if (step === 2) return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Dots />
      <Text style={styles.heading}>Drop your next gig.</Text>
      <Text style={styles.subtext}>See your pipeline come alive.</Text>
      <GigOSInput label="EVENT NAME" value={eventName} onChangeText={setEventName} placeholder="e.g. TRYST Saturday" containerStyle={{ marginTop: 24 }} />
      <View style={{ marginTop: 16 }}><DateField label="DATE" value={gigDate} onChange={setGigDate} placeholder="Select gig date" /></View>
      <GigOSInput label="VENUE" value={venue} onChangeText={setVenue} placeholder="e.g. Kitty Su, Mumbai" containerStyle={{ marginTop: 16 }} />
      <View style={{ marginTop: 16 }}>
        <TagGrid options={GIG_TYPES.map(t => GIG_TYPE_LABELS[t])} selected={[GIG_TYPE_LABELS[gigType]]} onToggle={(label) => {
          const entry = Object.entries(GIG_TYPE_LABELS).find(([, v]) => v === label);
          if (entry) setGigType(entry[0]);
        }} label="GIG TYPE" single />
      </View>
      <GigOSInput label="FEE" value={fee} onChangeText={setFee} keyboardType="numeric" prefix={currency === 'USD' ? '$' : '₹'} placeholder={currency === 'USD' ? '500' : '40000'} containerStyle={{ marginTop: 16 }} />
      <GigOSInput label="ADVANCE" value={advance} onChangeText={setAdvance} keyboardType="numeric" prefix={currency === 'USD' ? '$' : '₹'} placeholder={currency === 'USD' ? '200' : '15000'} containerStyle={{ marginTop: 16 }} />
      {fee && advance ? (
        <Text style={styles.balancePreview}>Balance due: {currency === 'USD' ? '$' : '₹'}{(parseInt(fee || '0') - parseInt(advance || '0')).toLocaleString()}</Text>
      ) : null}
      {step2Error ? <Text style={styles.errorText}>{step2Error}</Text> : null}
      <PrimaryButton title="ADD TO PIPELINE →" onPress={saveStep2} loading={loading} style={{ marginTop: 16 }} />
      <TouchableOpacity onPress={() => setStep(3)} style={styles.skipBtn}><Text style={styles.skipText}>Skip for now</Text></TouchableOpacity>
    </ScrollView>
  );

  // Step 3 — Celebration
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={[styles.scroll, { alignItems: 'center', justifyContent: 'center', minHeight: 500 }]}>
      <View style={[styles.checkCircle, Glow.cyan]}>
        <MaterialIcons name="check" size={48} color={Colors.textOnAccent} />
      </View>
      <Text style={[styles.heading, { textAlign: 'center', marginTop: 24 }]}>You're in the system.</Text>
      {createdGig ? (
        <View style={{ width: '100%', marginTop: 32 }}>
          <GigCard gigName={createdGig.event_name} date={createdGig.date} venueName={createdGig.venue_name} gigType={createdGig.gig_type} fee={createdGig.fee} currency={currency} advanceStatus={createdGig.advance_status} advanceAmount={createdGig.advance_amount} pipelineStatus={createdGig.pipeline_status} />
        </View>
      ) : null}
      <Text style={[styles.subtext, { marginTop: 16 }]}>Your pipeline is live.</Text>
      <PrimaryButton title="GO TO PIPELINE" onPress={finish} style={{ marginTop: 32, width: '100%' }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingBottom: 40 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 20, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: Colors.cyan },
  dotInactive: { width: 8, backgroundColor: Colors.surfaceCard },
  heading: { fontFamily: FontFamily.sairaBold, fontSize: 26, color: Colors.textPrimary },
  subtext: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary, marginTop: 4 },
  balancePreview: { fontFamily: FontFamily.monoRegular, fontSize: 12, color: Colors.textSecondary, marginTop: 8 },
  skipBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  skipText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary },
  errorText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.red, marginTop: 12, textAlign: 'center' },
  checkCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.cyan, alignItems: 'center', justifyContent: 'center' },
});
