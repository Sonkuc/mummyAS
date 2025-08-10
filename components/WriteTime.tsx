import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function TimestampRecorder() {
  const [timestamps, setTimestamps] = useState<string[]>([]);

  const handleAddTimestamp = () => {
    const now = new Date();
    const formatted = now.toLocaleString("cs-CZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setTimestamps((prev) => [formatted, ...prev]); // přidá nový na začátek seznamu
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handleAddTimestamp}>
        <Text style={styles.buttonText}>Zaznamenat čas</Text>
      </Pressable>

      {timestamps.length === 0 && <Text style={styles.noData}>Žádné záznamy</Text>}

      {timestamps.map((ts, index) => (
        <Text key={index} style={styles.timestamp}>
          {ts}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  button: {
    backgroundColor: "#993769",
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  noData: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
  timestamp: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
});