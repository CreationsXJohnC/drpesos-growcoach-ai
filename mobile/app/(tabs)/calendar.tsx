import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { TaskItem } from "@/components/TaskItem";

interface WeekData {
  week: number;
  stage: string;
  dates?: string;
  daily_tasks: string[];
  env_targets?: { temp?: string; rh?: string; vpd?: string; light?: string };
  nutrients?: string;
  dr_pesos_note?: string;
}

interface GrowCalendar {
  id: string;
  name: string | null;
  setup: { strainType?: string; medium?: string };
  total_weeks: number;
  estimated_harvest_date: string;
  weeks: WeekData[];
}

const STAGE_COLORS: Record<string, string> = {
  Seedling: "#86efac",
  Vegetative: "#4ade80",
  "Pre-Flower": "#a3e635",
  Flowering: "#d946ef",
  Ripening: "#f59e0b",
  Drying: "#78716c",
  Curing: "#a78bfa",
};

export default function CalendarScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuthStore();

  const [calendars, setCalendars] = useState<GrowCalendar[]>([]);
  const [selected, setSelected] = useState<GrowCalendar | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("grow_calendars")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        const cals = (data as GrowCalendar[]) ?? [];
        setCalendars(cals);
        if (id) {
          const found = cals.find((c) => c.id === id);
          if (found) setSelected(found);
        } else if (cals.length > 0) {
          setSelected(cals[0]);
        }
        setLoading(false);
      });
  }, [user, id]);

  const toggleTask = (task: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(task)) next.delete(task);
      else next.add(task);
      return next;
    });
  };

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
        <Text style={styles.emptyText}>Sign in to view your grow calendars</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push("/auth/login")}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (calendars.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🌱</Text>
        <Text style={styles.emptyTitle}>No grow calendars yet</Text>
        <Text style={styles.emptyText}>Generate your first personalized grow plan</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push("/calendar/new")}>
          <Text style={styles.btnText}>Create Grow Calendar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const week = selected?.weeks?.[selectedWeek];
  const stageColor = week ? STAGE_COLORS[week.stage] ?? "#22C55E" : "#22C55E";

  return (
    <View style={styles.container}>
      {/* Calendar selector */}
      {calendars.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectorBar}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 10 }}
        >
          {calendars.map((cal) => (
            <TouchableOpacity
              key={cal.id}
              style={[styles.selectorChip, selected?.id === cal.id && styles.selectorChipActive]}
              onPress={() => { setSelected(cal); setSelectedWeek(0); }}
            >
              <Text
                style={[styles.selectorText, selected?.id === cal.id && styles.selectorTextActive]}
                numberOfLines={1}
              >
                {cal.name ?? `${cal.setup?.strainType ?? "Grow"} ${cal.total_weeks}wk`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push("/calendar/new")}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {selected && (
          <>
            {/* Stage banner */}
            {week && (
              <View style={[styles.stageBanner, { borderColor: stageColor + "40" }]}>
                <View>
                  <Text style={[styles.stageName, { color: stageColor }]}>
                    {week.stage} — Week {week.week}
                  </Text>
                  {week.dates && <Text style={styles.stageDates}>{week.dates}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.askBtn}
                  onPress={() => router.push("/(tabs)/chat")}
                >
                  <Text style={styles.askBtnText}>Ask Dr. Pesos 🌿</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Env targets */}
            {week?.env_targets && (
              <View style={styles.envCard}>
                <Text style={styles.cardTitle}>Environmental Targets</Text>
                <View style={styles.envRow}>
                  {week.env_targets.temp && (
                    <View style={styles.envItem}>
                      <Text style={styles.envLabel}>🌡 Temp</Text>
                      <Text style={styles.envValue}>{week.env_targets.temp}</Text>
                    </View>
                  )}
                  {week.env_targets.rh && (
                    <View style={styles.envItem}>
                      <Text style={styles.envLabel}>💧 RH</Text>
                      <Text style={styles.envValue}>{week.env_targets.rh}</Text>
                    </View>
                  )}
                  {week.env_targets.vpd && (
                    <View style={styles.envItem}>
                      <Text style={styles.envLabel}>🌬 VPD</Text>
                      <Text style={styles.envValue}>{week.env_targets.vpd}</Text>
                    </View>
                  )}
                  {week.env_targets.light && (
                    <View style={styles.envItem}>
                      <Text style={styles.envLabel}>💡 Light</Text>
                      <Text style={styles.envValue}>{week.env_targets.light}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Tasks */}
            {week?.daily_tasks && week.daily_tasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.cardTitle}>This Week's Tasks</Text>
                {week.daily_tasks.map((task, i) => (
                  <TaskItem
                    key={i}
                    task={task}
                    completed={completedTasks.has(`${selected.id}-${selectedWeek}-${i}`)}
                    onToggle={() => toggleTask(`${selected.id}-${selectedWeek}-${i}`)}
                  />
                ))}
              </View>
            )}

            {/* Nutrients */}
            {week?.nutrients && (
              <View style={styles.noteCard}>
                <Text style={styles.cardTitle}>Nutrients</Text>
                <Text style={styles.noteText}>{week.nutrients}</Text>
              </View>
            )}

            {/* Dr. Pesos note */}
            {week?.dr_pesos_note && (
              <View style={[styles.noteCard, styles.drPesosCard]}>
                <Text style={styles.cardTitle}>🌿 Dr. Pesos Says</Text>
                <Text style={styles.noteText}>{week.dr_pesos_note}</Text>
              </View>
            )}

            {/* Week navigator */}
            <View style={styles.weekNav}>
              <TouchableOpacity
                style={[styles.weekNavBtn, selectedWeek === 0 && styles.weekNavBtnDisabled]}
                onPress={() => setSelectedWeek((w) => Math.max(0, w - 1))}
                disabled={selectedWeek === 0}
              >
                <Text style={styles.weekNavText}>← Prev Week</Text>
              </TouchableOpacity>
              <Text style={styles.weekNavLabel}>
                Week {selectedWeek + 1} / {selected.total_weeks}
              </Text>
              <TouchableOpacity
                style={[styles.weekNavBtn, selectedWeek >= selected.total_weeks - 1 && styles.weekNavBtnDisabled]}
                onPress={() => setSelectedWeek((w) => Math.min(selected.total_weeks - 1, w + 1))}
                disabled={selectedWeek >= selected.total_weeks - 1}
              >
                <Text style={styles.weekNavText}>Next Week →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: "#0A0A0A" },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#e8e8e8" },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center" },
  btn: { backgroundColor: "#22C55E", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { color: "#0A0A0A", fontWeight: "700", fontSize: 14 },
  selectorBar: { backgroundColor: "#111", borderBottomWidth: 1, borderBottomColor: "#1c1c1c", flexGrow: 0 },
  selectorChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a" },
  selectorChipActive: { backgroundColor: "#16301680", borderColor: "#22C55E" },
  selectorText: { fontSize: 13, color: "#777" },
  selectorTextActive: { color: "#22C55E", fontWeight: "600" },
  newBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: "#22C55E40", borderStyle: "dashed" },
  newBtnText: { fontSize: 13, color: "#22C55E" },
  content: { padding: 16, paddingBottom: 40 },
  stageBanner: { borderRadius: 14, borderWidth: 1, backgroundColor: "#0f1f0f", padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  stageName: { fontSize: 16, fontWeight: "700" },
  stageDates: { fontSize: 12, color: "#666", marginTop: 2 },
  askBtn: { backgroundColor: "#1a2f1a", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  askBtnText: { fontSize: 12, color: "#22C55E", fontWeight: "600" },
  envCard: { backgroundColor: "#141414", borderRadius: 12, borderWidth: 1, borderColor: "#2a2a2a", padding: 14, marginBottom: 12 },
  envRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
  envItem: { flex: 1, minWidth: "40%" },
  envLabel: { fontSize: 11, color: "#666", marginBottom: 2 },
  envValue: { fontSize: 13, color: "#22C55E", fontWeight: "600" },
  section: { marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  noteCard: { backgroundColor: "#141414", borderRadius: 12, borderWidth: 1, borderColor: "#2a2a2a", padding: 14, marginBottom: 12 },
  drPesosCard: { borderColor: "#22C55E30", backgroundColor: "#0f1f0f" },
  noteText: { fontSize: 13, color: "#c0c0c0", lineHeight: 20 },
  weekNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#1a1a1a" },
  weekNavBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  weekNavBtnDisabled: { opacity: 0.3 },
  weekNavText: { fontSize: 13, color: "#22C55E", fontWeight: "600" },
  weekNavLabel: { fontSize: 13, color: "#555" },
});
