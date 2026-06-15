// GigOS Settings Screen
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { getDJProfile, updateDJProfile, uploadAvatar, type DJProfile } from '@/src/services/supabaseData';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { GigOSInput, SectionLabel, SegmentedControl, PrimaryButton, LocationPicker, TagGrid } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';
import { ARTIST_TYPES, GENRES_BY_ARTIST_TYPE } from '@/src/constants/artistTypes';

const CURRENCIES = ['₹ INR', '$ USD'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [artistType, setArtistType] = useState('dj');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [currencyOpt, setCurrencyOpt] = useState('₹ INR');
  const [soundcloud, setSoundcloud] = useState('');
  const [instagram, setInstagram] = useState('');
  const [rateMin, setRateMin] = useState('');
  const [rateMax, setRateMax] = useState('');
  const [gstin, setGstin] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [bio, setBio] = useState('');
  const [bioChanged, setBioChanged] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [saved, setSaved] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    getDJProfile().then(p => {
      if (p) {
        setProfile(p); setName(p.name); setCity(p.city || '');
        setCountry(p.country || 'India'); setState(p.state || '');
        setCurrencyOpt(p.currency === 'USD' ? '$ USD' : '₹ INR');
        setSoundcloud(p.soundcloud_url || ''); setInstagram(p.instagram_handle || '');
        setRateMin(p.preferred_rate_min?.toString() || '');
        setRateMax(p.preferred_rate_max?.toString() || '');
        setGstin(p.gstin || '');
        setBusinessAddress(p.business_address || '');
        setBio(p.bio || '');
        setBioChanged(false);
        setGenres(p.genres || []);
        if (p.artist_type) setArtistType(p.artist_type);
      }
    });
  }, []));

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
      await uploadAvatar(result.assets[0].uri);
      setProfile(prev => prev ? { ...prev, avatar_url: result.assets![0].uri } : prev);
      setSaved('Saved ✓'); setTimeout(() => setSaved(''), 2000);
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Check your connection.');
    }
    setUploadingPhoto(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity testID="back-from-settings" onPress={() => router.back()}><MaterialIcons name="chevron-left" size={28} color={Colors.cyan} /></TouchableOpacity>
        <Text style={styles.navTitle}>Settings</Text>
        {saved ? <Text style={styles.savedText}>{saved}</Text> : <View style={{ width: 60 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile Photo ── */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarWrap} disabled={uploadingPhoto}>
            {profile?.avatar_url
              ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              : <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {(profile?.name || 'DJ').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
            }
            <View style={styles.cameraBtn}>
              {uploadingPhoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialIcons name="camera-alt" size={13} color="#fff" />
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        <SectionLabel>ACCOUNT</SectionLabel>
        <GigOSInput label="ARTIST NAME" value={name} onChangeText={setName} onBlur={() => debouncedSave({ name })} />
        <Text style={styles.fieldLabel}>ARTIST TYPE</Text>
        <View style={styles.chipGrid}>
          {ARTIST_TYPES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.chip, artistType === t.key && styles.chipActive]}
              onPress={() => { setArtistType(t.key); save({ artist_type: t.key }); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, artistType === t.key && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.fieldLabel}>BIO</Text>
            {bioChanged ? (
              <TouchableOpacity
                onPress={() => { save({ bio: bio.trim() || null }); setBioChanged(false); }}
                style={styles.saveBioBtn}
              >
                <Text style={styles.saveBioBtnText}>SAVE</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <GigOSInput
            value={bio}
            onChangeText={t => { setBio(t); setBioChanged(true); }}
            placeholder="House DJ based in Mumbai. Known for..."
            multiline
            numberOfLines={3}
          />
        </View>
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

        <View style={{ marginTop: 28 }}><SectionLabel>YOUR MUSIC</SectionLabel></View>
        <TagGrid
          options={GENRES_BY_ARTIST_TYPE[artistType] ?? GENRES_BY_ARTIST_TYPE.dj}
          selected={genres}
          onToggle={(g) => {
            const updated = genres.includes(g) ? genres.filter(x => x !== g) : [...genres, g];
            setGenres(updated);
            save({ genres: updated });
          }}
          label="GENRES"
        />
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
  signOutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  signOutText: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.red },
  photoSection: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, marginBottom: 20 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: Colors.cyan },
  avatarFallback: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surfaceCard, borderWidth: 2, borderColor: Colors.cyan, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: FontFamily.sairaBold, fontSize: 24, color: Colors.cyan },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.cyan, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.surfaceApp },
  photoHint: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textDisabled, marginTop: 8 },
  fieldLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase', marginBottom: 10 },
  saveBioBtn: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.cyan, borderRadius: 6 },
  saveBioBtnText: { fontFamily: FontFamily.monoMedium, fontSize: 10, color: Colors.textOnAccent, letterSpacing: 1 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.borderDefault },
  chipActive: { backgroundColor: 'rgba(24,200,230,0.10)', borderColor: Colors.cyan },
  chipText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary },
  chipTextActive: { fontFamily: FontFamily.sairaSemiBold, fontSize: 14, color: Colors.cyan },
  rateRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  invoiceHint: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textTertiary, lineHeight: 18, marginTop: 4 },
  gstNote: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.amber, marginTop: 8 },
});
