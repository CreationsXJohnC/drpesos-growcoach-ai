import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useChatStore } from "@/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";
import { streamChat } from "@/api/client";
import { ChatBubble } from "@/components/ChatBubble";
import type { ChatMessage } from "@/api/client";

const STARTERS = [
  "Build me a personalized 12-week indoor cannabis grow plan.",
  "What should my temp, humidity, and light schedule be for week 3 of flower?",
  "Give me an organic feeding schedule using Advanced Nutrients.",
  "Create a defoliation schedule for veg and early flower.",
  "How do I identify and fix common nutrient deficiencies?",
];

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Welcome to Dr. Pesos Grow Coach AI. 🌿\n\nI'm here to help you grow clean, healthy, top-quality cannabis with simple, actionable, step-by-step guidance.\n\nWhat can I help you with today?",
};

export default function ChatScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { messages, isStreaming, addMessage, updateLastAssistant, setStreaming, clearMessages } =
    useChatStore();

  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  const allMessages: ChatMessage[] = messages.length === 0 ? [WELCOME] : messages;

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      if (!session) {
        Alert.alert(
          "Sign In Required",
          "You need to sign in to chat with Dr. Pesos.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign In", onPress: () => router.push("/auth/login") },
          ]
        );
        return;
      }

      const userMsg: ChatMessage = { role: "user", content: text.trim() };
      addMessage(userMsg);
      setInput("");
      setStreaming(true);

      // Add placeholder assistant message
      const assistantPlaceholder: ChatMessage = { role: "assistant", content: "" };
      addMessage(assistantPlaceholder);
      scrollToBottom();

      try {
        const token = session.access_token;
        const history = [...messages, userMsg].filter(
          (m) => typeof m.content === "string" && m.content !== ""
        );

        for await (const chunk of streamChat(history, token)) {
          updateLastAssistant(chunk);
          scrollToBottom();
        }
      } catch (err: any) {
        let errText =
          "Something went wrong. Please try again.";
        if (err.status === 401) {
          errText = "🔒 Please sign in to continue chatting with Dr. Pesos.";
        } else if (err.status === 402) {
          errText =
            err.reason === "trial_expired"
              ? "⏰ Your free trial has ended. Upgrade to continue chatting with Dr. Pesos."
              : "📊 You've reached today's question limit. Upgrade for unlimited access.";
        }
        updateLastAssistant(errText);
      } finally {
        setStreaming(false);
        scrollToBottom();
      }
    },
    [session, isStreaming, messages, addMessage, updateLastAssistant, setStreaming, router]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🌿</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Dr. Pesos</Text>
            <Text style={styles.headerSubtitle}>Grow Coach AI · Powered by Claude</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearMessages} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={allMessages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={
          isStreaming ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#22C55E" />
              <Text style={styles.typingText}>Dr. Pesos is thinking...</Text>
            </View>
          ) : null
        }
      />

      {/* Conversation starters (show when no messages) */}
      {messages.length === 0 && (
        <View style={styles.starters}>
          <FlatList
            data={STARTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.starterChip}
                onPress={() => sendMessage(item)}
              >
                <Text style={styles.starterText} numberOfLines={2}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Dr. Pesos anything..."
          placeholderTextColor="#555"
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || isStreaming}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1c1c1c",
    backgroundColor: "#0A0A0A",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1a2f1a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
  headerSubtitle: { fontSize: 11, color: "#555" },
  clearBtn: { padding: 6 },
  clearBtnText: { fontSize: 13, color: "#555" },
  messagesList: { paddingTop: 12, paddingBottom: 8 },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typingText: { fontSize: 13, color: "#555", fontStyle: "italic" },
  starters: { paddingVertical: 10 },
  starterChip: {
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 220,
  },
  starterText: { fontSize: 12, color: "#999", lineHeight: 17 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#1c1c1c",
    backgroundColor: "#0A0A0A",
  },
  input: {
    flex: 1,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#1a2f1a", opacity: 0.5 },
  sendIcon: { color: "#0A0A0A", fontSize: 20, fontWeight: "700" },
});
