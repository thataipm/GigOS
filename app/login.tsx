// GigOS Login Screen
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout } from '@/src/theme/spacing';
import { GigOSInput, PrimaryButton, SectionLabel } from '@/src/components';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) { setError('Incorrect email or password. Try again.'); return; }
    router.replace('/(tabs)/pipeline');
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
          <Text style={styles.subtitle}>Welcome back</Text>
        </View>
        <View style={styles.form}>
          <SectionLabel>YOUR DETAILS</SectionLabel>
          <GigOSInput label="EMAIL" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@email.com" />
          <GigOSInput label="PASSWORD" value={password} onChangeText={setPassword} isPassword placeholder="••••••••" containerStyle={{ marginTop: 16 }} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
          <PrimaryButton title="SIGN IN" onPress={handleLogin} loading={loading} style={{ marginTop: 16 }} testID="login-submit-button" />
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} />
          </View>
          <TouchableOpacity testID="go-to-signup" onPress={() => router.push('/signup')} style={styles.linkRow}>
            <Text style={styles.linkGray}>Don't have an account? </Text>
            <Text style={styles.linkCyan}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 60, marginBottom: 40 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { fontFamily: FontFamily.sairaBold, fontSize: 32, color: Colors.white },
  oWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cyanDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cyan, shadowColor: Colors.cyan, shadowOpacity: 0.55, shadowRadius: 12, elevation: 4 },
  subtitle: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textSecondary, marginTop: 8 },
  form: { gap: 0 },
  error: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.red, marginTop: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderDefault },
  dividerText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkGray: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary },
  linkCyan: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.cyan },
  forgotRow: { alignSelf: 'flex-end', marginTop: 10, paddingVertical: 4 },
  forgotText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textTertiary },
});
