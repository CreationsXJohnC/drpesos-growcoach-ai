import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";

interface Calendar {
  id: string;
  name: string | null;
  setup: { strainType?: string; medium?: string; spaceSize?: string };
  total_weeks: number;
  estimated_harvest_date: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile, loading } = useAuthStore();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("grow_calendars")
      .select("id, name, setup, total_weeks, estimated_harvest_date")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setCalendars((data as Calendar[]) ?? []);
        setFetching(false);
      });
  }, [user]);

  const tier = profile?.subscription_tier ?? "free";
  const isPaid = tier !== "free";
  const trialHoursLeft = profile?.trial_start_date
    ? Math.max(0, 48 - (Date.now() - new Date(profile.trial_start_date).getTime()) / 3_600_000)
    : 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#22C55E" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Sign in to access your dashboard</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.title}>
            Welcome back, {user.email?.split("@")[0]}
          </Text>
          <Text style={styles.subtitle}>Ready to grow something great?</Text>
        </View>
        <Text style={[styles.tierBadge, isPaid && styles.tierBadgePaid]}>
          {tier === "free" ? "Free Trial" : tier.replace("_monthly", "").replace("_", " ")}
        </Text>
      </View>

      {/* Trial banner */}
      {tier === "free" && (
        <View style={styles.trialBanner}>
          <Text style={styles.trialText}>
            ⏱ {Math.floor(trialHoursLeft)}h {Math.floor((trialHoursLeft % 1) * 60)}m trial remaining
            {"  "}•{"  "}
            {Math.max(0, 3 - (profile?.questions_today ?? 0))}/3 questions today
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.upgradeBtnText}>Upgrade ⚡</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/chat")}
        >
          <Text style={styles.actionEmoji}>🌿</Text>
          <Text style={styles.actionLabel}>Ask Dr. Pesos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/calendar/new")}
        >
          <Text style={styles.actionEmoji}>📅</Text>
          <Text style={styles.actionLabel}>New Grow Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/diagnose")}
        >
          <Text style={styles.actionEmoji}>📷</Text>
          <Text style={styles.actionLabel}>Diagnose Plant</Text>
        </TouchableOpacity>
      </View>

      {/* Calendars */}
      <Text style={styles.sectionTitle}>Your Grow Calendars</Text>
      {fetching ? (
        <ActivityIndicator color="#22C55E" style={{ marginTop: 16 }} />
      ) : calendars.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>No grow calendars yet</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push("/calendar/new")}
          >
            <Text style={styles.btnText}>Create Your First Calendar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        calendars.map((cal) => {
          const harvest = new Date(cal.estimated_harvest_date).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric", year: "numeric" }
          );
          const name =
            cal.name ??
            `${cal.setup?.strainType ? cal.setup.strainType.charAt(0).toUpperCase() + cal.setup.strainType.slice(1) : ""}${cal.setup?.medium ? ` / ${cal.setup.medium}` : ""} Grow`;
          return (
            <TouchableOpacity
              key={cal.id}
              style={styles.calCard}
              onPress={() => router.push(`/(tabs)/calendar?id=${cal.id}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.calName}>{name}</Text>
                <Text style={styles.calMeta}>
                  {cal.total_weeks} weeks · Harvest est. {harvest}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        })
      )}

      {/* Conversation starters */}
      <Text style={styles.sectionTitle}>Quick Resources</Text>
      {[
        { label: "Beginner Setup Guide", prompt: "Help me set up my first indoor grow room. What do I need?" },
        { label: "Defoliation Schedule", prompt: "What's the Dr. Pesos defoliation schedule for veg and flower?" },
        { label: "Nutrient Deficiencies", prompt: "How do I identify and fix common nutrient deficiencies?" },
        { label: "Harvest Timing", prompt: "How do I know when it's time to harvest? What should I look for?" },
      ].map(({ label }) => (
        <TouchableOpacity key={label} style={styles.resourceRow}>
          <Text style={styles.resourceLabel}>{label}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: "#0A0A0A" },
  welcomeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#ffffff", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666" },
  tierBadge: { fontSize: 11, fontWeight: "600", color: "#eab308", borderWidth: 1, borderColor: "#eab30840", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tierBadgePaid: { color: "#22C55E", borderColor: "#22C55E40" },
  trialBanner: { backgroundColor: "#1a1500", borderWidth: 1, borderColor: "#eab30830", borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 10 },
  trialText: { flex: 1, fontSize: 12, color: "#eab308" },
  upgradeBtn: { backgroundColor: "#22C55E", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  upgradeBtnText: { fontSize: 12, fontWeight: "700", color: "#0A0A0A" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#d0d0d0", marginBottom: 12, marginTop: 8 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  actionCard: { flex: 1, backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 14, padding: 14, alignItems: "center", gap: 8 },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 11, fontWeight: "600", color: "#aaa", textAlign: "center" },
  emptyCard: { backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 14, padding: 24, alignItems: "center", gap: 12, marginBottom: 24 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 15, color: "#666", fontWeight: "500" },
  btn: { backgroundColor: "#22C55E", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { color: "#0A0A0A", fontWeight: "700", fontSize: 14 },
  calCard: { backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  calName: { fontSize: 14, fontWeight: "600", color: "#e8e8e8", marginBottom: 4 },
  calMeta: { fontSize: 12, color: "#666" },
  chevron: { fontSize: 22, color: "#444", marginLeft: 8 },
  resourceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  resourceLabel: { fontSize: 13, color: "#999" },
});
