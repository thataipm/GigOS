// GigOS Onboarding — Profile-first flow (v2)
import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { getDJProfile, updateDJProfile, uploadAvatar } from '@/src/services/supabaseData';
import { storage } from '@/src/utils/storage';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { GigOSInput, PrimaryButton, TagGrid, LocationPicker, SegmentedControl } from '@/src/components';
import { GENRES_BY_ARTIST_TYPE } from '@/src/constants/artistTypes';

const ARTIST_TYPES = [
  { key: 'dj',           label: 'DJ' },
  { key: 'singer',       label: 'Singer' },
  { key: 'live_band',    label: 'Live Band' },
  { key: 'mc',           label: 'MC / Host' },
  { key: 'producer',     label: 'Producer' },
  { key: 'percussionist', label: 'Percussionist' },
];

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Step 1 — Identity
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [djName, setDjName] = useState('');
  const [artistType, setArtistType] = useState('dj');

  // Step 2 — Location + Genres + Currency
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [country, setCountry] = useState('India');
  const [genres, setGenres] = useState<string[]>([]);
  const [currency, setCurrency] = useState('₹ INR');

  // Step 3 — Rate
  const [rateMin, setRateMin] = useState('');
  const [rateMax, setRateMax] = useState('');

  useEffect(() => {
    getDJProfile().then(p => {
      if (!p) return;
      setDjName(p.name || '');
      if (p.avatar_url) setAvatarUri(p.avatar_url);
      if (p.artist_type) setArtistType(p.artist_type);
      if (p.city) setCity(p.city);
      if (p.state) setStateVal(p.state);
      if (p.country) setCountry(p.country);
      if (p.genres?.length) setGenres(p.genres);
      if (p.preferred_rate_min) setRateMin(p.preferred_rate_min.toString());
      if (p.preferred_rate_max) setRateMax(p.preferred_rate_max.toString());
      if (p.currency) setCurrency(p.currency === 'USD' ? '$ USD' : '₹ INR');
    });
  }, []);

  // Live profile completeness — drives the mini-bar in steps 2+
  const completionPct = Math.round(
    [!!avatarUri, !!djName.trim(), !!city.trim(), genres.length > 0, !!(rateMin || rateMax)]
      .filter(Boolean).length / 5 * 100
  );

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow GigOS to access your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadAvatar(result.assets[0].uri);
      if (url) setAvatarUri(url);
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Check your connection.');
    }
    setUploadingPhoto(false);
  };

  const handleStep1 = async () => {
    if (!djName.trim()) {
      Alert.alert('Name required', 'Enter your artist name to continue.');
      return;
    }
    setSaving(true);
    await updateDJProfile({ name: djName.trim(), artist_type: artistType }).catch(() => {});
    setSaving(false);
    setStep(2);
  };

  const handleStep2 = async () => {
    setSaving(true);
    await updateDJProfile({
      city: city.trim() || null,
      country,
      genres,
      currency: currency.includes('USD') ? 'USD' : 'INR',
    }).catch(() => {});
    setSaving(false);
    setStep(3);
  };

  const handleFinish = async () => {
    setSaving(true);
    await updateDJProfile({
      preferred_rate_min: rateMin ? parseInt(rateMin) : null,
      preferred_rate_max: rateMax ? parseInt(rateMax) : null,
      onboarding_complete: true,
    }).catch(() => {});
    await storage.setItem('onboarding_complete', true);
    setSaving(false);
    router.replace('/(tabs)/profile');
  };

  // ── Shared UI ──

  const Progress = () => (
    <View style={styles.progressRow}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>{step}/{TOTAL_STEPS}</Text>
    </View>
  );

  const CompletenessBar = () => (
    <View style={styles.completenessRow}>
      <View style={styles.completenessTrack}>
        <View style={[styles.completenessFill, { width: `${completionPct}%` as any }]} />
      </View>
      <Text style={styles.completenessLabel}>Profile {completionPct}%</Text>
    </View>
  );

  // ─────────────────────────────────────────
  // Step 1 — Photo + Name + Artist Type
  // ─────────────────────────────────────────
  if (step === 1) return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Progress />

      <Text style={styles.heading}>Your artist card.</Text>
      <Text style={styles.subtext}>Set up your profile — the heart of GigOS.</Text>

      <TouchableOpacity
        style={styles.photoPicker}
        onPress={handlePickPhoto}
        disabled={uploadingPhoto}
        activeOpacity={0.8}
      >
        {avatarUri
          ? <Image source={{ uri: avatarUri }} style={styles.photoImage} />
          : (
            <View style={styles.photoPlaceholder}>
              {uploadingPhoto
                ? <ActivityIndicator color={Colors.cyan} />
                : (
                  <>
                    <MaterialIcons name="add-a-photo" size={30} color={Colors.cyan} />
                    <Text style={styles.photoHintText}>Add photo</Text>
                  </>
                )
              }
            </View>
          )
        }
        {avatarUri && !uploadingPhoto ? (
          <View style={styles.photoEditBadge}>
            <MaterialIcons name="camera-alt" size={13} color="#fff" />
          </View>
        ) : null}
      </TouchableOpacity>

      <GigOSInput
        label="ARTIST NAME"
        value={djName}
        onChangeText={setDjName}
        placeholder="e.g. DJ Sharma, Arjun Live, MC Ravi..."
        containerStyle={{ marginTop: 28 }}
      />

      <Text style={styles.fieldLabel}>ARTIST TYPE</Text>
      <View style={styles.chipGrid}>
        {ARTIST_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.chip, artistType === t.key && styles.chipActive]}
            onPress={() => setArtistType(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, artistType === t.key && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <PrimaryButton title="NEXT →" onPress={handleStep1} loading={saving} style={{ marginTop: 36 }} />
    </ScrollView>
  );

  // ─────────────────────────────────────────
  // Step 2 — City + Genres
  // ─────────────────────────────────────────
  if (step === 2) return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Progress />
      <CompletenessBar />

      <Text style={styles.heading}>Where do you perform?</Text>
      <Text style={styles.subtext}>Your base and the genres you play.</Text>

      <View style={{ marginTop: 24 }}>
        <LocationPicker
          country={country}
          state={stateVal}
          city={city}
          onChangeCountry={setCountry}
          onChangeState={setStateVal}
          onChangeCity={setCity}
          hideState
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <SegmentedControl
          options={['₹ INR', '$ USD']}
          value={currency}
          onChange={setCurrency}
          label="CURRENCY"
        />
      </View>

      <View style={{ marginTop: 28 }}>
        <TagGrid
          options={GENRES_BY_ARTIST_TYPE[artistType] ?? GENRES_BY_ARTIST_TYPE.dj}
          selected={genres}
          onToggle={(g) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
          label="GENRES YOU PLAY"
        />
      </View>

      <PrimaryButton title="NEXT →" onPress={handleStep2} loading={saving} style={{ marginTop: 36 }} />
      <TouchableOpacity onPress={() => setStep(3)} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ─────────────────────────────────────────
  // Step 3 — Rate + Socials
  // ─────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Progress />
      <CompletenessBar />

      <Text style={styles.heading}>Set your rate.</Text>
      <Text style={styles.subtext}>Keep your rate handy for every booking chat.</Text>

      <View style={styles.rateRow}>
        <GigOSInput
          label={`MIN FEE (${currency.includes('USD') ? '$' : '₹'})`}
          value={rateMin}
          onChangeText={setRateMin}
          keyboardType="numeric"
          prefix={currency.includes('USD') ? '$' : '₹'}
          placeholder="25,000"
          containerStyle={{ flex: 1 }}
        />
        <GigOSInput
          label={`MAX FEE (${currency.includes('USD') ? '$' : '₹'})`}
          value={rateMax}
          onChangeText={setRateMax}
          keyboardType="numeric"
          prefix={currency.includes('USD') ? '$' : '₹'}
          placeholder="1,50,000"
          containerStyle={{ flex: 1 }}
        />
      </View>

      <PrimaryButton
        title="GO TO MY PROFILE →"
        onPress={handleFinish}
        loading={saving}
        style={{ marginTop: 36 }}
      />
      <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip and go to profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingBottom: 52 },

  // Step progress bar
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, marginBottom: 28 },
  progressTrack: { flex: 1, height: 3, backgroundColor: Colors.surfaceCard, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: Colors.cyan, borderRadius: 2 },
  progressLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, color: Colors.textTertiary, letterSpacing: 0.5 },

  // Live completeness bar
  completenessRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  completenessTrack: { flex: 1, height: 2, backgroundColor: Colors.surfaceCard, borderRadius: 1, overflow: 'hidden' },
  completenessFill: { height: 2, backgroundColor: Colors.cyan, borderRadius: 1 },
  completenessLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, color: Colors.cyan, letterSpacing: 0.3 },

  heading: { fontFamily: FontFamily.sairaBold, fontSize: 26, color: Colors.textPrimary },
  subtext: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary, marginTop: 6, lineHeight: 22 },

  // Photo picker
  photoPicker: { alignSelf: 'center', marginTop: 24, position: 'relative' },
  photoImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2.5, borderColor: Colors.cyan },
  photoPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 2, borderColor: Colors.cyan,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoHintText: { fontFamily: FontFamily.plexRegular, fontSize: 10, color: Colors.cyan },
  photoEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.cyan,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surfaceApp,
  },

  fieldLabel: {
    fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4,
    color: Colors.textTertiary, textTransform: 'uppercase',
    marginTop: 24, marginBottom: 10,
  },

  // Artist type chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1, borderColor: Colors.borderDefault,
  },
  chipActive: { backgroundColor: 'rgba(24,200,230,0.10)', borderColor: Colors.cyan },
  chipText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary },
  chipTextActive: { fontFamily: FontFamily.sairaSemiBold, fontSize: 14, color: Colors.cyan },

  // Rate fields
  rateRow: { flexDirection: 'row', gap: 12, marginTop: 24 },

  skipBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 10 },
  skipText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary },
});
