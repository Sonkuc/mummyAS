import CustomHeader from "@/components/CustomHeader";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type StoredSleepRecord = {
  date: string;
  time: string;
  state: "sleep" | "awake"; // v úložišti jen tokeny
};

type EditableRecord = StoredSleepRecord & {
  label: string; // jen pro UI, neukládá se
};

// Pomocná funkce pro číslování "spánků"
const renumberSleeps = (records: StoredSleepRecord[]): EditableRecord[] => {
  let sleepCount = 0;
  return records.map((r) => {
    if (r.state === "sleep") {
      sleepCount++;
      return { ...r, label: `${sleepCount}. spánek od` };
    }
    return { ...r, label: "Vzhůru od" };
  });
};

const formatDateToCzech = (dateStr: string) => {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  }
  return dateStr;
};

// povolíme jen čísla a 1 dvojtečku, max délka 5
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

export default function SleepEdit() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { selectedChild, allChildren, selectedChildIndex, saveAllChildren, setSelectedChild } = useChild();

  const [records, setRecords] = useState<EditableRecord[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newState, setNewState] = useState<"awake" | "sleep">("awake");

  // Načtení záznamů pro dané datum
  useEffect(() => {
    if (!selectedChild || !selectedChild.sleepRecords || typeof date !== "string") return;

    const dayRecords: StoredSleepRecord[] = selectedChild.sleepRecords
      .filter((r) => r.date === date)
      .map((r) => {
        let state: "sleep" | "awake";
        if (r.state === "sleep" || r.state === "awake") {
          state = r.state;
        } else {
          const s = String(r.state).toLowerCase();
          state = s.includes("spán") ? "sleep" : "awake";
        }
        return { date: r.date, time: r.time, state };
      });

    // Pozn.: nevnucujeme opravu uložených nevalidních časů automaticky,
    // ale při editaci je uživatel bude muset opravit (onBlur / save zablokuje).
    setNewTime(new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }));
    setRecords(renumberSleeps(dayRecords));

    // Pokud existuje poslední záznam, nastavíme opačný stav
    if (dayRecords.length > 0) {
      const lastState = dayRecords[dayRecords.length - 1].state;
      setNewState(lastState === "sleep" ? "awake" : "sleep");
    } else {
      setNewState("sleep");
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
            const withoutDeleted: StoredSleepRecord[] = prev
              .filter((_, i) => i !== index)
              .map(({ label, ...rest }) => rest);
            return renumberSleeps(withoutDeleted);
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

    const newRec: StoredSleepRecord = {
      date: date!,
      time: norm,
      state: newState,
    };

    setRecords((prev) => {
      const withoutLabels: StoredSleepRecord[] = prev.map(({ label, ...rest }) => rest);
      const updated = [...withoutLabels, newRec].sort((a, b) => a.time.localeCompare(b.time));
      const renumbered = renumberSleeps(updated);

      // Najdeme poslední stav a přepneme opačný
      const lastState = updated[updated.length - 1].state;
      setNewState(lastState === "sleep" ? "awake" : "sleep");

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

    // znormalizujeme a ověříme všechny časy; pokud některý nevalidní -> zablokujeme uložení
    const normalized: StoredSleepRecord[] = [];
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

    const otherDays = (child.sleepRecords || []).filter(r => r.date !== date);
    child.sleepRecords = [...otherDays, ...normalized];

    saveAllChildren(updatedChildren);
    setSelectedChild(updatedChildren[selectedChildIndex]);
    router.back();
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/sleep" />
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
              style={[styles.switchBtn, newState === "awake" && styles.switchBtnActive]}
              onPress={() => setNewState("awake")}
            >
              <Text style={newState === "awake" ? styles.switchTextActive : styles.switchText}>
                Vzhůru od
              </Text>
            </Pressable>
            <Pressable
              style={[styles.switchBtn, newState === "sleep" && styles.switchBtnActive]}
              onPress={() => setNewState("sleep")}
            >
              <Text style={newState === "sleep" ? styles.switchTextActive : styles.switchText}>
                Spánek od
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
  saveBtn: {
    backgroundColor: "rgb(164, 91, 143)",
    padding: 5,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  icon: {
    fontSize: 20,
  },
  switchRow: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f2f2f2",
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
    backgroundColor: "#993769",
  },
  switchText: {
    color: "#333",
    fontSize: 14,
  },
  switchTextActive: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
