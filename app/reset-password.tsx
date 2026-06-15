import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout } from '@/src/theme/spacing';
import { GigOSInput, PrimaryButton } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const settled = useRef(false);

  useEffect(() => {
    const processUrl = async (url: string | null) => {
      if (!url || settled.current) return;

      // Parse tokens from URL fragment: gigos://reset-password#access_token=...&refresh_token=...
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      const fragment = url.split('#')[1] ?? '';
      if (fragment) {
        const p = new URLSearchParams(fragment);
        accessToken = p.get('access_token');
        refreshToken = p.get('refresh_token');
      }

      // Fallback: some email clients strip the fragment — try query string too
      if (!accessToken) {
        const query = (url.split('?')[1] ?? '').split('#')[0];
        const p = new URLSearchParams(query);
        accessToken = p.get('access_token');
        refreshToken = p.get('refresh_token');
      }

      if (!accessToken || !refreshToken) {
        settled.current = true;
        setTokenError('Invalid or expired reset link. Please request a new one.');
        return;
      }

      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      settled.current = true;
      if (sessionErr) {
        setTokenError('Reset link has expired. Please request a new one.');
      } else {
        setSessionReady(true);
      }
    };

    // Set up listener BEFORE getInitialURL to avoid race conditions
    const sub = Linking.addEventListener('url', ({ url }) => processUrl(url));
    Linking.getInitialURL().then(processUrl);

    // If neither path delivers a URL within 8 s, show a helpful error
    const timeout = setTimeout(() => {
      if (!settled.current) {
        settled.current = true;
        setTokenError('Could not read the reset link. Tap the link in your email again, or request a new one.');
      }
    }, 8000);

    return () => { sub.remove(); clearTimeout(timeout); };
  }, []);

  const handleReset = async () => {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateErr) { setError(updateErr.message); return; }
    setDone(true);
    setTimeout(() => router.replace('/login'), 2500);
  };

  // ── Loading / token parse state ──
  if (!sessionReady && !tokenError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.cyan} size="large" />
        <Text style={styles.loadingText}>Verifying reset link…</Text>
      </View>
    );
  }

  // ── Token error ──
  if (tokenError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <MaterialIcons name="error-outline" size={48} color={Colors.red} />
        <Text style={styles.errorTitle}>Link Invalid</Text>
        <Text style={styles.errorSub}>{tokenError}</Text>
        <TouchableOpacity onPress={() => router.replace('/forgot-password')} style={styles.link}>
          <Text style={styles.linkText}>Request new reset link</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Success ──
  if (done) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <View style={styles.checkCircle}>
          <MaterialIcons name="check" size={40} color={Colors.textOnAccent} />
        </View>
        <Text style={styles.successTitle}>Password updated!</Text>
        <Text style={styles.successSub}>Taking you to sign in…</Text>
      </View>
    );
  }

  // ── New password form ──
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Set new password</Text>
        <Text style={styles.subtext}>Choose a strong password for your GigOS account.</Text>

        <GigOSInput
          label="NEW PASSWORD"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Min. 8 characters"
          containerStyle={{ marginTop: 32 }}
        />
        <GigOSInput
          label="CONFIRM PASSWORD"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Repeat password"
          containerStyle={{ marginTop: 16 }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="UPDATE PASSWORD" onPress={handleReset} loading={loading} style={{ marginTop: 28 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  scroll:    { paddingHorizontal: Layout.screenGutter, paddingBottom: 40 },
  center:    { flex: 1, backgroundColor: Colors.surfaceApp, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  heading:   { fontFamily: FontFamily.sairaBold, fontSize: 28, color: Colors.textPrimary, marginTop: 24 },
  subtext:   { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary, marginTop: 8, lineHeight: 22 },
  error:     { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.red, marginTop: 8 },
  loadingText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary, marginTop: 16 },
  errorTitle:  { fontFamily: FontFamily.sairaBold, fontSize: 22, color: Colors.textPrimary },
  errorSub:    { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  link:        { marginTop: 16, paddingVertical: 8 },
  linkText:    { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.cyan },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: FontFamily.sairaBold, fontSize: 24, color: Colors.textPrimary },
  successSub:   { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary },
});
