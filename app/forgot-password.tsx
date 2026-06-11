// GigOS Forgot Password
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { GigOSInput, PrimaryButton } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (err) {
      setError('Could not send reset email. Check the address and try again.');
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
        <View style={styles.successWrap}>
          <View style={styles.checkCircle}>
            <MaterialIcons name="check" size={40} color={Colors.textOnAccent} />
          </View>
          <Text style={styles.successTitle}>Check your inbox</Text>
          <Text style={styles.successSub}>We sent a password reset link to{'\n'}{email}</Text>
          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
        <Text style={styles.heading}>Forgot password?</Text>
        <Text style={styles.subtext}>Enter your email and we'll send a reset link.</Text>
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
        <PrimaryButton title="SEND RESET LINK" onPress={handleReset} loading={loading} style={{ marginTop: 24 }} />
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
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  successTitle: { fontFamily: FontFamily.sairaBold, fontSize: 24, color: Colors.textPrimary, marginTop: 8 },
  successSub: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  loginLink: { marginTop: 24, paddingVertical: 8 },
  loginLinkText: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.cyan },
});
