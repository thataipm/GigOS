// GigOS Email Verification — OTP code entry
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout } from '@/src/theme/spacing';
import { PrimaryButton } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) { setError('Enter the verification code from your email.'); return; }
    setError('');
    setLoading(true);
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email!,
      token: code.trim(),
      type: 'signup',
    });
    if (err) {
      setError('Invalid or expired code. Try again or request a new one.');
      setLoading(false);
      return;
    }
    setLoading(false);
    router.replace('/onboarding');
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setCode('');
    await supabase.auth.resend({ type: 'signup', email: email! });
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.inner}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="mark-email-unread" size={36} color={Colors.cyan} />
          </View>
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.sub}>
            We sent a verification code to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Text style={styles.hint}>Enter the code from your email to verify your account.</Text>

          <TextInput
            style={[styles.codeInput, error ? styles.codeInputError : null]}
            value={code}
            onChangeText={t => { setCode(t.replace(/[^0-9]/g, '').slice(0, 8)); setError(''); }}
            keyboardType="number-pad"
            maxLength={8}
            placeholder="000000"
            placeholderTextColor={Colors.textTertiary}
            autoFocus
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {resent ? <Text style={styles.resentMsg}>New code sent!</Text> : null}

          <PrimaryButton title="VERIFY EMAIL" onPress={handleVerify} loading={loading} style={{ marginTop: 24, width: '100%' }} />

          <TouchableOpacity onPress={handleResend} style={styles.resendRow} disabled={resending}>
            <Text style={styles.resendText}>
              {resending ? 'Sending...' : "Didn't get it? Resend code"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  inner: { flex: 1, paddingHorizontal: Layout.screenGutter, paddingTop: 72, alignItems: 'center' },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1, borderColor: Colors.borderDefault,
  },
  heading: { fontFamily: FontFamily.sairaBold, fontSize: 28, color: Colors.textPrimary, textAlign: 'center' },
  sub: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  emailHighlight: { color: Colors.cyan },
  hint: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  codeInput: {
    marginTop: 36,
    width: '100%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    color: Colors.textPrimary,
    fontFamily: FontFamily.monoMedium,
    fontSize: 34,
    textAlign: 'center',
    letterSpacing: 14,
    paddingVertical: 18,
  },
  codeInputError: { borderColor: Colors.red },
  error: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.red, marginTop: 10, textAlign: 'center' },
  resentMsg: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.green, marginTop: 10, textAlign: 'center' },
  resendRow: { marginTop: 20, paddingVertical: 8 },
  resendText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.cyan },
});
