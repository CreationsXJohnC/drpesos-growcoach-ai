import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  task: string;
  completed: boolean;
  onToggle: () => void;
}

export function TaskItem({ task, completed, onToggle }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, completed && styles.checkboxDone]}>
        {completed && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={[styles.label, completed && styles.labelDone]}>{task}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginVertical: 3,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  check: {
    color: "#0A0A0A",
    fontSize: 13,
    fontWeight: "700",
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: "#d0d0d0",
    lineHeight: 20,
  },
  labelDone: {
    textDecorationLine: "line-through",
    color: "#555",
  },
});
