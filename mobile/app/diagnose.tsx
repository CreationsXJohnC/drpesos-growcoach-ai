import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { streamChat } from "@/api/client";

const SYMPTOM_CHIPS = [
  "Yellow leaves",
  "Brown spots",
  "Curling leaves",
  "White powder",
  "Wilting",
  "Purple stems",
  "Pale / light green",
  "Rust spots",
  "Holes in leaves",
  "Sticky residue",
];

const SEVERITY_COLORS: Record<string, string> = {
  HEALTHY: "#22C55E",
  MINOR: "#eab308",
  MODERATE: "#f97316",
  SEVERE: "#ef4444",
};

export default function DiagnoseScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [severity, setSeverity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (fromCamera = false) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please grant photo access to diagnose your plant.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: ["images"] });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setDiagnosis("");
      setSeverity(null);
    }
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const analyze = async () => {
    if (!imageBase64) {
      Alert.alert("No Photo", "Please select or take a photo of your plant first.");
      return;
    }

    if (!session) {
      Alert.alert("Sign In Required", "Please sign in to use plant diagnosis.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    setLoading(true);
    setDiagnosis("");
    setSeverity(null);

    const symptomText =
      selectedSymptoms.length > 0 ? `Visible symptoms: ${selectedSymptoms.join(", ")}.` : "";
    const contextText = context.trim() ? `Additional context: ${context.trim()}` : "";

    const userContent = [
      {
        type: "image",
        source: { type: "base64", mediaType: "image/jpeg", data: imageBase64 },
      } as any,
      {
        type: "text",
        text: `Please analyze this cannabis plant photo and provide a detailed diagnosis.\n\n${symptomText}\n${contextText}\n\nStructure your response as:\n1. **Diagnosis** — What issue(s) do you see?\n2. **Severity** — HEALTHY / MINOR / MODERATE / SEVERE\n3. **Root Cause** — Why is this happening?\n4. **Corrective Actions** — Step-by-step fixes\n5. **Prevention** — How to prevent recurrence\n\nBe specific and actionable. Start your severity line with "Severity: SEVERITY_LEVEL"`,
      },
    ];

    const messages = [{ role: "user" as const, content: userContent }];

    let fullText = "";
    try {
      for await (const chunk of streamChat(messages, session.access_token)) {
        fullText += chunk;
        setDiagnosis(fullText);

        // Parse severity
        const match = fullText.match(/Severity:\s*(HEALTHY|MINOR|MODERATE|SEVERE)/i);
        if (match) setSeverity(match[1].toUpperCase());
      }
    } catch (err: any) {
      setDiagnosis(
        err.status === 402
          ? "⏰ Your trial has ended or daily limit reached. Upgrade to use plant diagnosis."
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Photo picker */}
      <Text style={styles.sectionTitle}>Plant Photo</Text>
      <View style={styles.photoArea}>
        {imageUri ? (
          <TouchableOpacity onPress={() => { setImageUri(null); setImageBase64(null); }}>
            <Image source={{ uri: imageUri }} style={styles.photo} />
            <Text style={styles.changePhoto}>Tap to change photo</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderEmoji}>📷</Text>
            <Text style={styles.photoPlaceholderText}>Upload a photo of your plant</Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)}>
                <Text style={styles.photoBtnText}>📁 Library</Text>
              </TouchableOpacity>
              {Platform.OS !== "web" && (
                <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)}>
                  <Text style={styles.photoBtnText}>📸 Camera</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Symptom chips */}
      <Text style={styles.sectionTitle}>Visible Symptoms (optional)</Text>
      <View style={styles.chipsGrid}>
        {SYMPTOM_CHIPS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, selectedSymptoms.includes(s) && styles.chipSelected]}
            onPress={() => toggleSymptom(s)}
          >
            <Text style={[styles.chipText, selectedSymptoms.includes(s) && styles.chipTextSelected]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Context input */}
      <Text style={styles.sectionTitle}>Additional Context (optional)</Text>
      <TextInput
        style={styles.contextInput}
        placeholder="e.g., Week 4 of flower, coco/perlite, LED 600W, pH 6.1..."
        placeholderTextColor="#555"
        value={context}
        onChangeText={setContext}
        multiline
        numberOfLines={3}
      />

      {/* Analyze button */}
      <TouchableOpacity
        style={[styles.analyzeBtn, (!imageUri || loading) && styles.analyzeBtnDisabled]}
        onPress={analyze}
        disabled={!imageUri || loading}
      >
        {loading ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text style={styles.analyzeBtnText}>🔬 Analyze My Plant</Text>
        )}
      </TouchableOpacity>

      {/* Diagnosis result */}
      {(diagnosis || loading) && (
        <View style={styles.resultCard}>
          {severity && (
            <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[severity] + "20", borderColor: SEVERITY_COLORS[severity] + "50" }]}>
              <Text style={[styles.severityText, { color: SEVERITY_COLORS[severity] }]}>
                {severity === "HEALTHY" ? "✓" : severity === "MINOR" ? "⚠" : severity === "MODERATE" ? "⚠️" : "🚨"}{" "}
                {severity}
              </Text>
            </View>
          )}
          {loading && !diagnosis && (
            <View style={styles.thinkingRow}>
              <ActivityIndicator color="#22C55E" size="small" />
              <Text style={styles.thinkingText}>Dr. Pesos is analyzing your plant...</Text>
            </View>
          )}
          <Text style={styles.diagnosisText}>{diagnosis}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
  photoArea: { marginBottom: 8 },
  photo: { width: "100%", height: 220, borderRadius: 14, resizeMode: "cover" },
  changePhoto: { textAlign: "center", fontSize: 12, color: "#555", marginTop: 6 },
  photoPlaceholder: {
    borderWidth: 2,
    borderColor: "#2a2a2a",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 36,
    alignItems: "center",
    gap: 10,
    backgroundColor: "#111",
  },
  photoPlaceholderEmoji: { fontSize: 40 },
  photoPlaceholderText: { fontSize: 14, color: "#666" },
  photoButtons: { flexDirection: "row", gap: 12 },
  photoBtn: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  photoBtnText: { fontSize: 13, color: "#aaa", fontWeight: "600" },
  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#141414" },
  chipSelected: { backgroundColor: "#163016", borderColor: "#22C55E" },
  chipText: { fontSize: 12, color: "#888" },
  chipTextSelected: { color: "#22C55E", fontWeight: "600" },
  contextInput: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#e8e8e8",
    textAlignVertical: "top",
    minHeight: 80,
  },
  analyzeBtn: { backgroundColor: "#22C55E", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 20 },
  analyzeBtnDisabled: { opacity: 0.4 },
  analyzeBtnText: { color: "#0A0A0A", fontWeight: "700", fontSize: 16 },
  resultCard: { marginTop: 20, backgroundColor: "#111", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 14, padding: 16, gap: 12 },
  severityBadge: { alignSelf: "flex-start", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  severityText: { fontSize: 13, fontWeight: "700" },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  thinkingText: { fontSize: 13, color: "#555", fontStyle: "italic" },
  diagnosisText: { fontSize: 14, color: "#c8c8c8", lineHeight: 22 },
});
