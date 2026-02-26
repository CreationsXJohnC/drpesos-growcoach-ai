import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { API_BASE_URL } from "@/api/client";

const TIER_LABELS: Record<string, string> = {
  free: "Free Trial",
  grower_monthly: "Grower Monthly",
  commercial_monthly: "Commercial Monthly",
  lifetime: "Lifetime",
};

const TIER_FEATURES: Record<string, string[]> = {
  free: [
    "✓ AI chat (3 questions/day, 48-hour window)",
    "✓ Grow calendar generator (limited)",
    "✗ Unlimited chat",
    "✗ Photo diagnosis",
    "✗ Push notifications",
  ],
  grower_monthly: [
    "✓ Unlimited AI chat",
    "✓ Full grow calendar generator",
    "✓ Photo plant diagnosis",
    "✓ Daily push notifications",
    "✗ Commercial SOP mode",
  ],
  commercial_monthly: [
    "✓ Everything in Grower",
    "✓ Commercial SOP mode",
    "✓ KPI tracking & batch workflows",
    "✓ Priority support",
  ],
  lifetime: [
    "✓ Everything in Grower — forever",
    "✓ No monthly fees",
    "✓ All future updates included",
  ],
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();

  const tier = profile?.subscription_tier ?? "free";
  const isPaid = tier !== "free";

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const handleUpgrade = () => {
    Linking.openURL(`${API_BASE_URL}/pricing`);
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>👤</Text>
        <Text style={styles.emptyTitle}>Not signed in</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push("/auth/login")}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Account info */}
      <View style={styles.accountCard}>
        <View style={styles.accountAvatar}>
          <Text style={styles.accountAvatarText}>
            {user.email?.charAt(0).toUpperCase() ?? "U"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountEmail}>{user.email}</Text>
          <View style={[styles.tierBadge, isPaid && styles.tierBadgePaid]}>
            <Text style={[styles.tierBadgeText, isPaid && styles.tierBadgeTextPaid]}>
              {tier === "lifetime" ? "👑 " : ""}
              {TIER_LABELS[tier] ?? tier}
            </Text>
          </View>
        </View>
      </View>

      {/* Current plan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Plan</Text>
        <View style={styles.card}>
          {(TIER_FEATURES[tier] ?? []).map((f) => (
            <Text key={f} style={[styles.featureText, f.startsWith("✗") && styles.featureTextOff]}>
              {f}
            </Text>
          ))}
          {!isPaid && (
            <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
              <Text style={styles.upgradeBtnText}>⚡ Upgrade Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Trial info */}
      {tier === "free" && profile?.trial_start_date && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Free Trial</Text>
          <View style={styles.card}>
            <Text style={styles.metaText}>
              Trial started:{" "}
              {new Date(profile.trial_start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
            <Text style={styles.metaText}>
              Questions used today: {profile.questions_today ?? 0} / 3
            </Text>
          </View>
        </View>
      )}

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.metaText}>Dr. Pesos Grow Coach AI v1.0.0</Text>
          <Text style={styles.metaText}>Powered by Claude AI · Ori Company · We Grow Life</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL(`${API_BASE_URL}/pricing`)}
          >
            <Text style={styles.linkText}>View All Plans →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#0A0A0A" },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#e8e8e8" },
  btn: { backgroundColor: "#22C55E", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { color: "#0A0A0A", fontWeight: "700", fontSize: 14 },
  accountCard: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 28 },
  accountAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#22C55E30", alignItems: "center", justifyContent: "center" },
  accountAvatarText: { fontSize: 22, fontWeight: "700", color: "#22C55E" },
  accountEmail: { fontSize: 15, color: "#e8e8e8", fontWeight: "600", marginBottom: 6 },
  tierBadge: { alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: "#eab30840", backgroundColor: "#1a1400" },
  tierBadgePaid: { borderColor: "#22C55E40", backgroundColor: "#0f1f0f" },
  tierBadgeText: { fontSize: 11, fontWeight: "600", color: "#eab308" },
  tierBadgeTextPaid: { color: "#22C55E" },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: "#141414", borderRadius: 14, borderWidth: 1, borderColor: "#2a2a2a", padding: 16, gap: 8 },
  featureText: { fontSize: 14, color: "#c0c0c0", lineHeight: 22 },
  featureTextOff: { color: "#444" },
  upgradeBtn: { backgroundColor: "#22C55E", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 8 },
  upgradeBtnText: { color: "#0A0A0A", fontWeight: "700", fontSize: 14 },
  metaText: { fontSize: 13, color: "#888", lineHeight: 20 },
  linkRow: { paddingTop: 4 },
  linkText: { fontSize: 13, color: "#22C55E", fontWeight: "600" },
  signOutBtn: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#ef444430", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  signOutText: { fontSize: 15, color: "#ef4444", fontWeight: "600" },
});
