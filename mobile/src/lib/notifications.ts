import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permissions.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Schedule a daily grow task reminder.
 * Fires every day at the specified hour and minute.
 */
export async function scheduleDailyGrowReminder(
  hour = 8,
  minute = 0
): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  // Cancel any existing reminders first
  await cancelDailyGrowReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌿 Good morning, Grower!",
      body: "Dr. Pesos here — time to check on your grow. Open the app for today's tasks.",
      data: { type: "daily_reminder" },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

/**
 * Schedule a one-time notification (e.g., for a specific grow task).
 */
export async function scheduleTaskNotification(
  title: string,
  body: string,
  scheduledDate: Date
): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledDate,
    },
  });

  return id;
}

/**
 * Cancel all scheduled grow daily reminders.
 */
export async function cancelDailyGrowReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === "daily_reminder") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

/**
 * Get the Expo Push Token for this device (used for server-side push via Expo's push service).
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return token.data;
  } catch {
    return null;
  }
}
