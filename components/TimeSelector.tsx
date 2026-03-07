import { COLORS } from "@/constants/MyColors";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";

type Props = {
  time: string; // HH:MM format
  onChange: (time: string) => void;
};

const getCleanTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function TimeSelector({ time, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [tempTime, setTempTime] = useState<string>(time || "");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    setTempTime(time || getCleanTime());
  }, [time]);

  const parseTime = (timeStr: string | undefined | null): Date => {
    const d = new Date(); // DNEŠNÍ DATUM (např. 31.1.2026)
    
    if (!timeStr || typeof timeStr !== 'string') return d;

    const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
    if (!m) return d;

    // Nastavíme hodiny a minuty do DNEŠNÍHO objektu
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d;
  };

  const formatTime = (date: Date): string => {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  // Tato hodnota jde do Pickeru
  const safeValue = parseTime(tempTime);

  return (
    <>
      <Pressable
        style={styles.input}
        onPress={() => setShow(true)}
      >
        <Text style={{ fontSize: 15, textAlign: "center"}}>
          {tempTime || getCleanTime()}
        </Text>
      </Pressable>

      <Modal visible={show} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#222" : "#fff" }]}>
            <DateTimePicker
              value={safeValue} // Teď obsahuje rok 2026, ne 1970
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              is24Hour={true}
              // Tímto Picker definitivně ukotvíme v aktuálním dni
              minimumDate={new Date(new Date().setHours(0,0,0,0))}
              maximumDate={new Date(new Date().setHours(23,59,59,999))}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  const formatted = formatTime(selectedDate);
                  setTempTime(formatted);
                  if (Platform.OS === "android") {
                    onChange(formatted);
                    setShow(false);
                  }
                }
              }}
              themeVariant={isDark ? "dark" : "light"}
              style={{ width: "100%" }}
            />
            <View style={styles.buttonRow}>
              <Pressable onPress={() => setShow(false)} style={styles.cancelButton}>
                <Text style={[styles.buttonText, { color: isDark ? "#fff" : "#000" }]}>Zrušit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const final = tempTime || getCleanTime();
                  onChange(final);
                  setShow(false);
                }}
                style={styles.confirmButton}
              >
                <Text style={[styles.buttonText, { color: isDark ? "#fff" : "#000" }]}>Potvrdit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    width: 70,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#ccc",
    padding: 5,
    marginHorizontal: 30,
    textAlign: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContent: {
    marginHorizontal: 30,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#ccc",
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.secundary,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
  },
});