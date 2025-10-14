import CustomHeader from "@/components/CustomHeader";
import GroupSection from "@/components/GroupSection";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import type { BreastfeedingRecord } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type DisplayBreastfeedingRecord = BreastfeedingRecord & { label: string };

// číslování spánků
const renumberFeed = (records: BreastfeedingRecord[]): DisplayBreastfeedingRecord[] => {
  let feedCount = 0;
  return records.map((r) => {
    if (r.state === "start") {
      feedCount++;
      return { ...r, label: `Začátek ${feedCount}. kojení` };
    }
    return { ...r, label: "Konec kojení" };
  });
};

// povolit jen čísla a 1 dvojtečku, max délka 5
const handleTimeInput = (txt: string, set: (v: string) => void) => {
  let t = txt.replace(/[^\d:]/g, ""); // jen čísla a :
  // odstraníme případné další dvojtečky
  const firstColon = t.indexOf(":");
  if (firstColon !== -1) {
    t = t.slice(0, firstColon + 1) + t.slice(firstColon + 1).replace(/:/g, "");
  }
  // omezíme délku
  if (t.length > 5) t = t.slice(0, 5);
  set(t);
};

// vrátí validní HH:MM nebo null
const normalizeTime = (input: string): string | null => {
  if (!input) return null;
  const m = input.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
};

export default function BreastfeedingEdit() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { selectedChild, allChildren, selectedChildIndex, saveAllChildren, setSelectedChild } = useChild();

  const [records, setRecords] = useState<DisplayBreastfeedingRecord[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newState, setNewState] = useState<"stop" | "start">("stop");

  // Načtení záznamů pro dané datum
  useEffect(() => {
    if (!selectedChild || !selectedChild.breastfeedingRecords || typeof date !== "string") return;

    const dayRecords: BreastfeedingRecord[] = selectedChild.breastfeedingRecords
      .filter((r) => r.date === date)
      .map((r) => {
        let state: "start" | "stop";
        if (r.state === "start" || r.state === "stop") {
          state = r.state;
        } else {
          const s = String(r.state).toLowerCase();
          state = s.includes("Zač") ? "start" : "stop";
        }
        return { date: r.date, time: r.time, state };
      });

    // nevnucuje se oprava uložených nevalidních časů automaticky,
    // ale při editaci je uživatel musí opravit (onBlur / save zablokuje).
    setNewTime(new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));
    setRecords(renumberFeed(dayRecords));

    // Pokud existuje poslední záznam, nastaví se opačný stav
    if (dayRecords.length > 0) {
      const lastState = dayRecords[dayRecords.length - 1].state;
      setNewState(lastState === "start" ? "stop" : "start");
    } else {
      setNewState("start");
    }
  }, [selectedChild, date]);

  // Úprava času
  const updateTime = (index: number, newTimeValue: string) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time: newTimeValue };
      return updated;
    });
  };

  // Smazání záznamu
  const deleteRecord = (index: number) => {
    Alert.alert("Smazat záznam?", "Opravdu chceš tento záznam smazat?", [
      { text: "Zrušit", style: "cancel" },
      {
        text: "Smazat",
        style: "destructive",
        onPress: () => {
          setRecords((prev) => {
            const withoutDeleted: BreastfeedingRecord[] = prev
              .filter((_, i) => i !== index)
              .map(({ label, ...rest }) => rest);
            return renumberFeed(withoutDeleted);
          });
        },
      },
    ]);
  };

  const addRecord = () => {
    // normalizace newTime před přidáním
    const norm = normalizeTime(newTime);
    if (!norm) {
      Alert.alert("Chybný čas", "Zadej čas ve formátu HH:MM (0–23 h, 0–59 min).");
      return;
    }

    const newRec: BreastfeedingRecord = {
      date: date!,
      time: norm,
      state: newState,
    };

    setRecords((prev) => {
      const withoutLabels: BreastfeedingRecord[] = prev.map(({ label, ...rest }) => rest);
      const updated = [...withoutLabels, newRec].sort((a, b) => a.time.localeCompare(b.time));
      const renumbered = renumberFeed(updated);

      // Najdeme poslední stav a přepneme opačný
      const lastState = updated[updated.length - 1].state;
      setNewState(lastState === "start" ? "stop" : "start");

      // Předvyplníme aktuální čas
      const now = new Date();
      const currentTime = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
      setNewTime(currentTime);

      return renumbered;
    });
  };

  // Uložení změn
  const saveChanges = () => {
    if (selectedChildIndex === null) return;

    // znormalizují se a ověřují všechny časy; pokud některý nevalidní -> zablokuje uložení
    const normalized: BreastfeedingRecord[] = [];
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const norm = normalizeTime(r.time);
      if (!norm) {
        Alert.alert("Chybný čas", `Záznam č. ${i + 1} obsahuje neplatný čas. Oprav ho prosím.`);
        return;
      }
      normalized.push({ date: r.date, time: norm, state: r.state });
    }

    // uložíme normalized (správné) časy
    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];

    const otherDays = (child.breastfeedingRecords || []).filter(r => r.date !== date);
    child.breastfeedingRecords = [...otherDays, ...normalized];

    saveAllChildren(updatedChildren);
    setSelectedChild(updatedChildren[selectedChildIndex]);
    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/breastfeeding" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Upravit záznam</Title>
        <Subtitle style={{ textAlign: "center" }}>{formatDateToCzech(String(date))}</Subtitle>

        {records.map((rec, idx) => (
          <GroupSection key={idx} style={styles.row}>
            <Text style={{ flex: 1 }}>{rec.label}</Text>
            <TextInput
              style={styles.input}
              value={rec.time}
              // filtrujeme vstup už během psaní
              onChangeText={(txt) => handleTimeInput(txt, (t) => updateTime(idx, t))}
              onBlur={() => {
                const current = records[idx]?.time ?? "";
                const norm = normalizeTime(current);
                if (norm) {
                  updateTime(idx, norm);
                } else {
                  Alert.alert("Chybný čas", "Zadej čas ve formátu HH:MM (0–23 h, 0–59 min).");
                  updateTime(idx, ""); // smažeme neplatný, uživatel musí opravit
                }
              }}
            />
            <Pressable onPress={() => deleteRecord(idx)}>
              <Text style={styles.icon}>🚮</Text>
            </Pressable>
          </GroupSection>
        ))}

        <GroupSection style={styles.row}>
          <View style={[styles.switchRow, { flex: 1 }]}>
            <Pressable
              style={[styles.switchBtn, newState === "start" && styles.switchBtnActive]}
              onPress={() => setNewState("start")}
            >
              <Text style={newState === "start" ? styles.switchTextActive : styles.switchText}>
                Začátek
              </Text>
            </Pressable>
            <Pressable
              style={[styles.switchBtn, newState === "stop" && styles.switchBtnActive]}
              onPress={() => setNewState("stop")}
            >
              <Text style={newState === "stop" ? styles.switchTextActive : styles.switchText}>
                Konec
              </Text>
            </Pressable>
          </View>

          <TextInput
            placeholder="HH:MM"
            style={styles.input}
            value={newTime}
            onChangeText={(txt) => handleTimeInput(txt, setNewTime)}
            onBlur={() => {
              const norm = normalizeTime(newTime);
              if (norm) setNewTime(norm);
              else {
                Alert.alert("Chybný čas", "Zadej čas ve formátu HH:MM (0–23 h, 0–59 min).");
                setNewTime("");
              }
            }}
          />

          <Pressable onPress={addRecord}>
            <Text style={styles.icon}>✅</Text>
          </Pressable>
        </GroupSection>

        <View style={{ marginTop: 30 }}>
          <MyButton title="Uložit" onPress={saveChanges} />
        </View>
      </ScrollView>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#ccc",
    padding: 5,
    marginHorizontal: 30,
    textAlign: "center",
  },
  icon: {
    fontSize: 20,
  },
  switchRow: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.switchNonActive,
    borderWidth: 1,
    borderColor: "#ccc",
    maxWidth: 200,
    width: "90%",
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  switchBtnActive: {
    backgroundColor: COLORS.primary,
  },
  switchText: {
    fontSize: 14,
  },
  switchTextActive: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
