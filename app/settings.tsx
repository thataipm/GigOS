// GigOS Settings Screen
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { getDJProfile, updateDJProfile, type DJProfile } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { GigOSInput, SectionLabel, SegmentedControl, PrimaryButton, LocationPicker } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

const CURRENCIES = ['₹ INR', '$ USD'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [currencyOpt, setCurrencyOpt] = useState('₹ INR');
  const [soundcloud, setSoundcloud] = useState('');
  const [instagram, setInstagram] = useState('');
  const [rateMin, setRateMin] = useState('');
  const [rateMax, setRateMax] = useState('');
  const [profilePublic, setProfilePublic] = useState(false);
  const [gstin, setGstin] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [saved, setSaved] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getDJProfile().then(p => {
      if (p) {
        setProfile(p); setName(p.name); setCity(p.city || '');
        setCountry(p.country || 'India'); setState(p.state || '');
        setCurrencyOpt(p.currency === 'USD' ? '$ USD' : '₹ INR');
        setSoundcloud(p.soundcloud_url || ''); setInstagram(p.instagram_handle || '');
        setRateMin(p.preferred_rate_min?.toString() || '');
        setRateMax(p.preferred_rate_max?.toString() || '');
        setProfilePublic(p.profile_public);
        setGstin(p.gstin || '');
        setBusinessAddress(p.business_address || '');
      }
    });
  }, []);

  const save = useCallback(async (updates: Partial<DJProfile>) => {
    const updated = await updateDJProfile(updates);
    if (updated) { setProfile(updated); setSaved('Saved ✓'); setTimeout(() => setSaved(''), 2000); }
  }, []);

  // Debounced save — prevents multiple PATCH calls on rapid blur events
  const debouncedSave = useCallback((updates: Partial<DJProfile>, delayMs = 400) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => save(updates), delayMs);
  }, [save]);

  const handleSignOut = async () => { await signOut(); router.replace('/login'); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity testID="back-from-settings" onPress={() => router.back()}><MaterialIcons name="chevron-left" size={28} color={Colors.cyan} /></TouchableOpacity>
        <Text style={styles.navTitle}>Settings</Text>
        {saved ? <Text style={styles.savedText}>{saved}</Text> : <View style={{ width: 60 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionLabel>ACCOUNT</SectionLabel>
        <GigOSInput label="DJ NAME" value={name} onChangeText={setName} onBlur={() => debouncedSave({ name })} />
        <View style={{ marginTop: 16 }}>
          <LocationPicker label="LOCATION" country={country} state={state} city={city}
            onChangeCountry={(c) => { setCountry(c); save({ country: c }); }}
            onChangeState={(s) => { setState(s); save({ state: s }); }}
            onChangeCity={(c) => { setCity(c); save({ city: c }); }} />
        </View>
        <View style={styles.emailRow}>
          <Text style={styles.emailLabel}>EMAIL</Text>
          <Text style={styles.emailValue}>{user?.email}</Text>
        </View>

        <View style={{ marginTop: 28 }}><SectionLabel>PREFERENCES</SectionLabel></View>
        <SegmentedControl label="DEFAULT CURRENCY" options={CURRENCIES} value={currencyOpt} onChange={(c) => { setCurrencyOpt(c); save({ currency: c.includes('USD') ? 'USD' : 'INR' }); }} />

        <View style={{ marginTop: 28 }}><SectionLabel>YOUR PROFILE</SectionLabel></View>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Public Profile</Text>
            <Text style={styles.switchSub}>Your verified profile is visible publicly</Text>
          </View>
          <Switch value={profilePublic} onValueChange={(v) => { setProfilePublic(v); save({ profile_public: v }); }} trackColor={{ false: Colors.graphite500, true: Colors.cyanDim }} thumbColor={profilePublic ? Colors.cyan : Colors.graphite400} />
        </View>

        <GigOSInput label="SOUNDCLOUD URL" value={soundcloud} onChangeText={setSoundcloud} onBlur={() => debouncedSave({ soundcloud_url: soundcloud || null })} placeholder="soundcloud.com/yourname" containerStyle={{ marginTop: 16 }} />
        <GigOSInput label="INSTAGRAM" value={instagram} onChangeText={setInstagram} onBlur={() => debouncedSave({ instagram_handle: instagram || null })} placeholder="yourhandle" prefix="@" containerStyle={{ marginTop: 16 }} />

        <View style={{ marginTop: 28 }}><SectionLabel>RATE RANGE</SectionLabel></View>
        <View style={styles.rateRow}>
          <GigOSInput
            label="MIN FEE"
            value={rateMin}
            onChangeText={setRateMin}
            keyboardType="numeric"
            prefix={currencyOpt.includes('USD') ? '$' : '₹'}
            placeholder={currencyOpt.includes('USD') ? '300' : '25000'}
            onBlur={() => debouncedSave({ preferred_rate_min: rateMin ? parseInt(rateMin) : null })}
            containerStyle={{ flex: 1 }}
          />
          <GigOSInput
            label="MAX FEE"
            value={rateMax}
            onChangeText={setRateMax}
            keyboardType="numeric"
            prefix={currencyOpt.includes('USD') ? '$' : '₹'}
            placeholder={currencyOpt.includes('USD') ? '2000' : '150000'}
            onBlur={() => debouncedSave({ preferred_rate_max: rateMax ? parseInt(rateMax) : null })}
            containerStyle={{ flex: 1 }}
          />
        </View>

        {/* ── Invoice Settings ── */}
        <View style={{ marginTop: 28 }}><SectionLabel>INVOICE</SectionLabel></View>
        <Text style={styles.invoiceHint}>Used on invoices you generate from gig details.</Text>
        <GigOSInput
          label="BUSINESS ADDRESS"
          value={businessAddress}
          onChangeText={setBusinessAddress}
          onBlur={() => debouncedSave({ business_address: businessAddress.trim() || null })}
          placeholder="Mumbai, Maharashtra 400001"
          containerStyle={{ marginTop: 12 }}
        />
        <GigOSInput
          label="GSTIN (optional)"
          value={gstin}
          onChangeText={setGstin}
          onBlur={() => debouncedSave({ gstin: gstin.trim().toUpperCase() || null })}
          placeholder="22AAAAA0000A1Z5"
          autoCapitalize="characters"
          containerStyle={{ marginTop: 16 }}
        />
        {gstin.trim() ? (
          <Text style={styles.gstNote}>18% GST will be shown on invoices.</Text>
        ) : null}

        <View style={{ marginTop: 40 }}><SectionLabel>ACCOUNT</SectionLabel></View>
        <TouchableOpacity testID="sign-out-btn" onPress={handleSignOut} style={styles.signOutRow}>
          <MaterialIcons name="logout" size={20} color={Colors.red} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  savedText: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.cyan },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingTop: 20, paddingBottom: 40 },
  emailRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emailLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase' },
  emailValue: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  switchLabel: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary },
  switchSub: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  signOutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  signOutText: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.red },
  rateRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  invoiceHint: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textTertiary, lineHeight: 18, marginTop: 4 },
  gstNote: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.amber, marginTop: 8 },
});
