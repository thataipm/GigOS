// GigOS Splash → Auth check → Redirect
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { getDJProfile } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { storage } from '@/src/utils/storage';

export default function SplashIndex() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const dotGlow = useRef(new Animated.Value(0.4)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(taglineOpacity, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(dotGlow, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(dotGlow, { toValue: 0.4, duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(async () => {
        if (session) {
          // Check local cache first (fast), fall back to DB (reliable across devices)
          let onboarded = await storage.getItem('onboarding_complete', false);
          if (!onboarded) {
            const profile = await getDJProfile();
            onboarded = profile?.onboarding_complete ?? false;
            if (onboarded) await storage.setItem('onboarding_complete', true); // warm the cache
          }
          router.replace(onboarded ? '/(tabs)/pipeline' : '/onboarding');
        } else {
          router.replace('/login');
        }
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [loading, session]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.wordmarkRow}>
        <Text style={styles.wordmark}>Gig</Text>
        <View style={styles.oContainer}>
          <Text style={styles.wordmark}>O</Text>
          <Animated.View style={[styles.cyanDot, { opacity: dotGlow }]} />
        </View>
        <Text style={styles.wordmark}>S</Text>
      </View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        RUN THE NIGHT · KNOW YOUR MONEY
      </Animated.Text>
      <View style={styles.readyWrap}>
        <View style={styles.readyLine} />
        <Text style={styles.readyText}>READY</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp, alignItems: 'center', justifyContent: 'center' },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { fontFamily: FontFamily.sairaBold, fontSize: 52, color: Colors.white, letterSpacing: -1 },
  oContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  cyanDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.cyan, shadowColor: Colors.cyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 12, elevation: 8 },
  tagline: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 2, color: Colors.textSecondary, marginTop: 16, textTransform: 'uppercase' },
  readyWrap: { position: 'absolute', bottom: 80, alignItems: 'center', gap: 8 },
  readyLine: { width: 60, height: 1, backgroundColor: Colors.cyan, opacity: 0.5 },
  readyText: { fontFamily: FontFamily.monoMedium, fontSize: 9, letterSpacing: 2, color: Colors.cyan, textTransform: 'uppercase' },
});
