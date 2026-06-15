// GigOS Root Layout — Auth guard + Font loading
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { Colors } from '@/src/theme/colors';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { Saira_400Regular, Saira_600SemiBold, Saira_700Bold } from '@expo-google-fonts/saira';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';

SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'onboarding' || segments[0] === 'forgot-password' || segments[0] === 'reset-password' || segments[0] === 'verify-email' || segments[0] === 'privacy-policy';
    const isIndex = segments.length === 0 || segments[0] === undefined;
    if (!session && !inAuthGroup && !isIndex) {
      router.replace('/login');
    }
  }, [session, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [timedOut, setTimedOut] = useState(false);
  const [fontsLoaded, fontsError] = useFonts({
    Saira_400Regular, Saira_600SemiBold, Saira_700Bold,
    IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium,
  });

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const allReady = (iconsLoaded || iconsError || timedOut) && (fontsLoaded || fontsError || timedOut);

  useEffect(() => {
    if (allReady) SplashScreen.hideAsync();
  }, [allReady]);

  if (!allReady) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGuard>
          <View style={styles.root}>
            <StatusBar style="light" backgroundColor={Colors.surfaceApp} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surfaceApp }, animation: 'fade', animationDuration: 200 }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="gig/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="chase" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              <Stack.Screen name="nudge" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="reset-password" options={{ animation: 'fade' }} />
              <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="verify-email" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </View>
        </AuthGuard>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.surfaceApp } });
