import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      } else {
        router.replace('/forgot-password');
      }
    });
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

  if (!sessionReady) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </View>
    );
  }

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
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: FontFamily.sairaBold, fontSize: 24, color: Colors.textPrimary },
  successSub:   { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary },
});
