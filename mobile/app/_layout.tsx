import "react-native-url-polyfill/auto";
import React, { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { scheduleDailyGrowReminder } from "@/lib/notifications";

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const notificationListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Hydrate session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Schedule daily reminder for authenticated users
      if (session) scheduleDailyGrowReminder(8, 0);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) scheduleDailyGrowReminder(8, 0);
      }
    );

    // Handle notification taps (when app opens from a notification)
    notificationListener.current =
      Notifications.addNotificationResponseReceivedListener((_response) => {
        // Could navigate to calendar tab on notification tap
      });

    return () => {
      subscription.unsubscribe();
      notificationListener.current?.remove();
    };
  }, [setSession]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0A0A0A" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#0A0A0A" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/login"
          options={{ title: "Sign In", presentation: "modal" }}
        />
        <Stack.Screen
          name="auth/signup"
          options={{ title: "Create Account", presentation: "modal" }}
        />
        <Stack.Screen
          name="calendar/new"
          options={{ title: "New Grow Calendar" }}
        />
        <Stack.Screen
          name="diagnose"
          options={{ title: "Diagnose My Plant", presentation: "modal" }}
        />
      </Stack>
    </>
  );
}
