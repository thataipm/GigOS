// GigOS Forgot Password
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout } from '@/src/theme/spacing';
import { GigOSInput, PrimaryButton } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (err) {
      setError('Could not send reset email. Check the address and try again.');
    } else {
      setStep('otp');
    }
  };

  const handleVerify = async () => {
    if (otp.trim().length !== 8) { setError('Enter the 8-digit code from your email.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'recovery',
    });
    setLoading(false);
    if (err) {
      setError('Invalid or expired code. Try requesting a new one.');
    } else {
      router.replace('/reset-password');
    }
  };

  if (step === 'otp') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => { setStep('email'); setError(''); setOtp(''); }} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
          </TouchableOpacity>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.subtext}>
            We sent an 8-digit code to{'\n'}<Text style={{ color: Colors.cyan }}>{email}</Text>
          </Text>
          <GigOSInput
            label="RESET CODE"
            value={otp}
            onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 8))}
            keyboardType="number-pad"
            placeholder="00000000"
            containerStyle={{ marginTop: 32 }}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title="VERIFY CODE" onPress={handleVerify} loading={loading} style={{ marginTop: 24 }} />
          <TouchableOpacity onPress={() => { setStep('email'); setError(''); setOtp(''); }} style={styles.cancelRow}>
            <Text style={styles.cancelText}>Use a different email</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
        <Text style={styles.heading}>Forgot password?</Text>
        <Text style={styles.subtext}>Enter your email and we'll send an 8-digit reset code.</Text>
        <GigOSInput
          label="EMAIL"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@email.com"
          containerStyle={{ marginTop: 32 }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title="SEND RESET CODE" onPress={handleSend} loading={loading} style={{ marginTop: 24 }} />
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelRow}>
          <Text style={styles.cancelText}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingBottom: 40 },
  backBtn: { paddingTop: 8, paddingBottom: 4, width: 44 },
  heading: { fontFamily: FontFamily.sairaBold, fontSize: 28, color: Colors.textPrimary, marginTop: 24 },
  subtext: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary, marginTop: 8, lineHeight: 22 },
  error: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.red, marginTop: 8 },
  cancelRow: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  cancelText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textTertiary },
});
