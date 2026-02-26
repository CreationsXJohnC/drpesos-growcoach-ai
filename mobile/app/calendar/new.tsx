import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { generateCalendar } from "@/api/client";

const STEPS = [
  "Experience Level",
  "Strain Type",
  "Grow Medium",
  "Light Type",
  "Goals",
  "Confirm",
];

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "🌱 Beginner", sub: "First or second grow" },
  { value: "intermediate", label: "🌿 Intermediate", sub: "2–5 grows completed" },
  { value: "commercial", label: "🏭 Commercial", sub: "Production scale growing" },
];

const STRAIN_OPTIONS = [
  { value: "indica", label: "💜 Indica", sub: "Relaxing · Dense buds" },
  { value: "sativa", label: "🌿 Sativa", sub: "Energetic · Longer flower" },
  { value: "hybrid", label: "⚗️ Hybrid", sub: "Balanced effects" },
  { value: "autoflower", label: "⚡ Autoflower", sub: "Fastest · 10–12 weeks total" },
];

const MEDIUM_OPTIONS = [
  { value: "soil", label: "🪴 Soil", sub: "Easiest · Forgiving" },
  { value: "coco", label: "🥥 Coco Coir", sub: "Fast growth · Precise feeding" },
  { value: "hydro", label: "💧 Hydro (DWC)", sub: "Fastest growth · Experienced" },
  { value: "rockwool", label: "🔶 Rockwool", sub: "Commercial standard" },
];

const LIGHT_OPTIONS = [
  { value: "led", label: "💡 LED", sub: "Energy efficient · Less heat" },
  { value: "hps", label: "🔶 HPS", sub: "Proven yields · More heat" },
  { value: "cmh", label: "🌕 CMH/LEC", sub: "Full spectrum · Balanced" },
  { value: "t5", label: "📏 T5/CFL", sub: "Best for seedlings/clones" },
];

const GOAL_OPTIONS = [
  { value: "yield", label: "⚖️ Maximum Yield" },
  { value: "quality", label: "💎 Top Quality / Terpenes" },
  { value: "speed", label: "⚡ Fastest Cycle" },
  { value: "stealth", label: "🥷 Low Odor / Stealth" },
];

interface SetupState {
  experienceLevel: string;
  strainType: string;
  medium: string;
  lightType: string;
  goals: string[];
  spaceSize: string;
}

function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: { value: string; label: string; sub?: string };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onSelect}
      activeOpacity={0.75}
    >
      <Text style={styles.optionLabel}>{option.label}</Text>
      {option.sub && <Text style={styles.optionSub}>{option.sub}</Text>}
      {selected && <Text style={styles.optionCheck}>✓</Text>}
    </TouchableOpacity>
  );
}

export default function NewCalendarScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [setup, setSetup] = useState<SetupState>({
    experienceLevel: "",
    strainType: "",
    medium: "",
    lightType: "",
    goals: [],
    spaceSize: "4x4",
  });

  const goNext = () => setStep((s) => s + 1);
  const goPrev = () => setStep((s) => s - 1);

  const set = (key: keyof SetupState, value: string) =>
    setSetup((prev) => ({ ...prev, [key]: value }));

  const toggleGoal = (g: string) =>
    setSetup((prev) => ({
      ...prev,
      goals: prev.goals.includes(g) ? prev.goals.filter((x) => x !== g) : [...prev.goals, g],
    }));

  const canProceed = () => {
    switch (step) {
      case 0: return !!setup.experienceLevel;
      case 1: return !!setup.strainType;
      case 2: return !!setup.medium;
      case 3: return !!setup.lightType;
      case 4: return setup.goals.length > 0;
      case 5: return true;
      default: return false;
    }
  };

  const handleGenerate = async () => {
    if (!session) {
      Alert.alert("Sign In Required", "Please sign in to generate a grow calendar.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    setGenerating(true);
    try {
      const calendarData = await generateCalendar(
        {
          ...setup,
          startDate: new Date().toISOString().split("T")[0],
        },
        session.access_token
      );

      // Save to Supabase
      const { data: saved, error } = await supabase.from("grow_calendars").insert({
        user_id: session.user.id,
        setup,
        weeks: calendarData.weeks,
        total_weeks: calendarData.weeks?.length ?? 12,
        estimated_harvest_date: calendarData.estimated_harvest_date ?? new Date(Date.now() + 84 * 86400_000).toISOString(),
      }).select().single();

      if (error) throw error;

      Alert.alert("Grow Calendar Created! 🌿", "Your personalized grow calendar is ready.", [
        { text: "View Calendar", onPress: () => router.replace(`/(tabs)/calendar?id=${(saved as any).id}`) },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Generation Failed",
        err.status === 402
          ? "Your trial has ended. Upgrade to generate grow calendars."
          : "Something went wrong. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>
      <Text style={styles.stepLabel}>
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <>
            <Text style={styles.stepTitle}>What's your experience level?</Text>
            {EXPERIENCE_OPTIONS.map((o) => (
              <OptionCard key={o.value} option={o} selected={setup.experienceLevel === o.value} onSelect={() => set("experienceLevel", o.value)} />
            ))}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>What strain type are you growing?</Text>
            {STRAIN_OPTIONS.map((o) => (
              <OptionCard key={o.value} option={o} selected={setup.strainType === o.value} onSelect={() => set("strainType", o.value)} />
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>What's your grow medium?</Text>
            {MEDIUM_OPTIONS.map((o) => (
              <OptionCard key={o.value} option={o} selected={setup.medium === o.value} onSelect={() => set("medium", o.value)} />
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>What lighting are you using?</Text>
            {LIGHT_OPTIONS.map((o) => (
              <OptionCard key={o.value} option={o} selected={setup.lightType === o.value} onSelect={() => set("lightType", o.value)} />
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>What are your grow goals?</Text>
            <Text style={styles.stepSub}>Select all that apply</Text>
            {GOAL_OPTIONS.map((o) => (
              <OptionCard key={o.value} option={o} selected={setup.goals.includes(o.value)} onSelect={() => toggleGoal(o.value)} />
            ))}
          </>
        )}

        {step === 5 && (
          <>
            <Text style={styles.stepTitle}>Ready to generate your calendar</Text>
            <View style={styles.summaryCard}>
              {[
                ["Experience", setup.experienceLevel],
                ["Strain", setup.strainType],
                ["Medium", setup.medium],
                ["Light", setup.lightType],
                ["Goals", setup.goals.join(", ")],
              ].map(([label, value]) => (
                <View key={label} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{label}</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.genNote}>
              🌿 Dr. Pesos will generate a complete week-by-week grow plan with daily tasks, environmental targets, and nutrient schedules tailored to your setup.
            </Text>
          </>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={goPrev} disabled={generating}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        {step < STEPS.length - 1 ? (
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled, step === 0 && styles.nextBtnFull]}
            onPress={goNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, styles.generateBtn, generating && styles.nextBtnDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text style={styles.nextBtnText}>⚡ Generate My Calendar</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  progressBar: { height: 3, backgroundColor: "#1a1a1a" },
  progressFill: { height: 3, backgroundColor: "#22C55E" },
  stepLabel: { fontSize: 12, color: "#555", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, fontWeight: "500" },
  content: { padding: 20, paddingBottom: 20 },
  stepTitle: { fontSize: 22, fontWeight: "700", color: "#ffffff", marginBottom: 6, lineHeight: 30 },
  stepSub: { fontSize: 14, color: "#666", marginBottom: 16 },
  optionCard: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionCardSelected: { borderColor: "#22C55E", backgroundColor: "#0f1f0f" },
  optionLabel: { fontSize: 15, fontWeight: "600", color: "#e8e8e8", flex: 1 },
  optionSub: { fontSize: 12, color: "#666", marginTop: 2 },
  optionCheck: { fontSize: 18, color: "#22C55E", fontWeight: "700" },
  summaryCard: { backgroundColor: "#141414", borderRadius: 14, borderWidth: 1, borderColor: "#2a2a2a", padding: 16, marginBottom: 16, gap: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, color: "#666", fontWeight: "600" },
  summaryValue: { fontSize: 13, color: "#e8e8e8", flex: 1, textAlign: "right", textTransform: "capitalize" },
  genNote: { fontSize: 13, color: "#666", lineHeight: 20, textAlign: "center", paddingHorizontal: 10 },
  navBar: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: "#1a1a1a", backgroundColor: "#0A0A0A" },
  backBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: "#1a1a1a" },
  backBtnText: { fontSize: 15, color: "#888", fontWeight: "600" },
  nextBtn: { flex: 1, backgroundColor: "#22C55E", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  nextBtnFull: { flex: 1 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: "#0A0A0A", fontWeight: "700", fontSize: 15 },
  generateBtn: { backgroundColor: "#22C55E" },
});
