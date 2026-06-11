// GigOS Sign Up Screen
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Space, Layout } from '@/src/theme/spacing';
import { GigOSInput, PrimaryButton, SectionLabel, SegmentedControl, LocationPicker } from '@/src/components';

const CURRENCIES = ['₹ INR', '$ USD'];

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('₹ INR');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name || name.length < 2) e.name = 'DJ name required (min 2 chars)';
    if (!email || !email.includes('@')) e.email = 'Valid email required';
    if (!password || password.length < 8) e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await signUp(email, password, name);
    if (result.error) { setErrors({ general: result.error }); setLoading(false); return; }
    const curr = currency.includes('USD') ? 'USD' : 'INR';
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('djs').update({ city, country, state: state || null, currency: curr }).eq('user_id', user.id);
    }
    setLoading(false);
    router.replace('/onboarding');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmark}>Gig</Text>
            <View style={styles.oWrap}><Text style={styles.wordmark}>O</Text><View style={styles.cyanDot} /></View>
            <Text style={styles.wordmark}>S</Text>
          </View>
          <Text style={styles.subtitle}>Join the grid</Text>
        </View>
        <View style={styles.form}>
          <SectionLabel>YOUR DETAILS</SectionLabel>
          <GigOSInput label="DJ NAME" value={name} onChangeText={setName} placeholder='e.g. DJ Kohra, Sandunes, Ritviz...' autoCapitalize="words" error={errors.name} />
          <GigOSInput label="EMAIL" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@email.com" error={errors.email} containerStyle={{ marginTop: 16 }} />
          <GigOSInput label="PASSWORD" value={password} onChangeText={setPassword} isPassword placeholder="••••••••" error={errors.password} containerStyle={{ marginTop: 16 }} />
          <Text style={styles.hint}>Minimum 8 characters</Text>

          <View style={{ marginTop: 28 }}>
            <SectionLabel>YOUR SETUP</SectionLabel>
            <LocationPicker label="LOCATION" country={country} state={state} city={city} onChangeCountry={setCountry} onChangeState={setState} onChangeCity={setCity} />
            <View style={{ marginTop: 16 }}>
              <SegmentedControl label="CURRENCY" options={CURRENCIES} value={currency} onChange={setCurrency} />
            </View>
          </View>

          {errors.general ? <Text style={styles.error}>{errors.general}</Text> : null}
          <PrimaryButton title="CREATE ACCOUNT" onPress={handleSignUp} loading={loading} style={{ marginTop: 32 }} testID="signup-submit-button" />

          <TouchableOpacity testID="go-to-login" onPress={() => router.push('/login')} style={styles.linkRow}>
            <Text style={styles.linkGray}>Already have an account? </Text>
            <Text style={styles.linkCyan}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 60, marginBottom: 32 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { fontFamily: FontFamily.sairaBold, fontSize: 32, color: Colors.white },
  oWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cyanDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cyan, shadowColor: Colors.cyan, shadowOpacity: 0.55, shadowRadius: 12, elevation: 4 },
  subtitle: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary, marginTop: 8 },
  form: {},
  hint: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary, marginTop: 4 },
  fieldError: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.red, marginTop: 4 },
  error: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.red, marginTop: 12, textAlign: 'center' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkGray: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary },
  linkCyan: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.cyan },
});
