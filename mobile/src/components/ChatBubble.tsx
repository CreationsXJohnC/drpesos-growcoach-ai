import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ChatMessage } from "@/api/client";

interface Props {
  message: ChatMessage;
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === "user";
  const text =
    typeof message.content === "string"
      ? message.content
      : message.content.map((b) => b.text ?? "").join("");

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🌿</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[styles.text, isUser ? styles.userText : styles.assistantText]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  userContainer: {
    justifyContent: "flex-end",
  },
  assistantContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a2f1a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 2,
  },
  avatarText: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: "#22C55E",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#1c1c1c",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#0A0A0A",
    fontWeight: "500",
  },
  assistantText: {
    color: "#e8e8e8",
  },
});
