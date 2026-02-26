import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { app: "drpesos-mobile" },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert("Sign Up Failed", error.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View style={styles.centered}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>Check your email!</Text>
        <Text style={styles.successText}>
          We sent a confirmation link to {email}. Click it to activate your
          account and start your free 48-hour trial.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push("/auth/login")}>
          <Text style={styles.btnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Text style={styles.logoEmoji}>🌿</Text>
          <View>
            <Text style={styles.logoTitle}>Dr. Pesos</Text>
            <Text style={styles.logoSub}>Grow Coach AI</Text>
          </View>
        </View>

        <Text style={styles.heading}>Start your free trial</Text>
        <Text style={styles.subheading}>48 hours · 3 questions/day · No credit card</Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (8+ characters)"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor="#555"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Creating Account..." : "Create Account"}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  inner: { flexGrow: 1, justifyContent: "center", padding: 28 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 14, backgroundColor: "#0A0A0A" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  logoEmoji: { fontSize: 40 },
  logoTitle: { fontSize: 20, fontWeight: "800", color: "#22C55E" },
  logoSub: { fontSize: 13, color: "#555" },
  heading: { fontSize: 26, fontWeight: "700", color: "#ffffff", marginBottom: 6 },
  subheading: { fontSize: 14, color: "#666", marginBottom: 28 },
  input: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#ffffff",
    marginBottom: 14,
  },
  btn: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#0A0A0A", fontWeight: "700", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, color: "#666" },
  footerLink: { fontSize: 14, color: "#22C55E", fontWeight: "600" },
  successEmoji: { fontSize: 56 },
  successTitle: { fontSize: 22, fontWeight: "700", color: "#ffffff" },
  successText: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 22 },
});
