// GigOS Notification Service — Local push notifications for gig reminders
// NOTE: Requires expo-notifications to be installed:
//   npx expo install expo-notifications   (in frontend/)
// Until then, all functions are safe no-ops.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { type Gig } from './supabaseData';

// Lazy-load expo-notifications — safe no-op in Expo Go (push removed since SDK 53)
// and if the package isn't installed.
function getNotifications(): any | null {
  if (Constants.appOwnership === 'expo') return null;
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

/** Call this once at app root (_layout.tsx) */
export function configureNotifications() {
  const N = getNotifications();
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Android 8+ notification channel — call once on startup */
export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  const N = getNotifications();
  if (!N) return;
  await N.setNotificationChannelAsync('gig-reminders', {
    name: 'Gig Reminders',
    importance: N.AndroidImportance?.HIGH ?? 4,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#18C8E6',
    sound: 'default',
  }).catch(() => {});
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  try {
    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function cancelGigNotifications(gigId: string): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  const types = ['week', 'day', 'today', 'payment'];
  await Promise.all(
    types.map(t => N.cancelScheduledNotificationAsync(`gig-${gigId}-${t}`).catch(() => {}))
  );
}

/**
 * Schedules 4 local notifications for a gig:
 *  • 7 days before: advance chase reminder
 *  • 1 day before: final prep reminder
 *  • Day of (9 AM): go-time nudge
 *  • 3 days after: balance payment chase (only if not yet paid)
 *
 * Silently no-ops if expo-notifications not installed, permissions denied, or dates already passed.
 */
export async function scheduleGigNotifications(gig: Gig): Promise<void> {
  try {
    const N = getNotifications();
    if (!N) return;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await cancelGigNotifications(gig.id);

    const gigDate = new Date(gig.date + 'T00:00:00');
    const now = Date.now();
    const venue = gig.venue_name ? ` at ${gig.venue_name}` : '';

    const schedule = async (identifier: string, title: string, body: string, targetMs: number) => {
      const secondsUntil = Math.floor((targetMs - now) / 1000);
      if (secondsUntil < 60) return;
      await N.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          data: { gigId: gig.id },
          sound: 'default',
          ...(Platform.OS === 'android' ? { channelId: 'gig-reminders' } : {}),
        },
        trigger: { seconds: secondsUntil, repeats: false },
      });
    };

    const t = gigDate.getTime();

    await schedule(
      `gig-${gig.id}-week`,
      '🎧 Gig in 7 days',
      `${gig.event_name}${venue} — confirm details & chase advance if needed.`,
      t - 7 * 86_400_000
    );
    await schedule(
      `gig-${gig.id}-day`,
      '🎧 Gig tomorrow!',
      `${gig.event_name}${venue}. All set? 🔥`,
      t - 86_400_000
    );
    await schedule(
      `gig-${gig.id}-today`,
      '🎧 Gig today — run the night',
      `${gig.event_name}${venue}. 🔊`,
      t + 9 * 3_600_000
    );

    if (gig.balance_status !== 'received' && gig.pipeline_status !== 'paid') {
      await schedule(
        `gig-${gig.id}-payment`,
        '💰 Chase your payment',
        `${gig.event_name} was 3 days ago. Follow up on your balance.`,
        t + 3 * 86_400_000
      );
    }
  } catch {
    // Non-critical — never crash the app over notification issues
  }
}
