import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import MainScreenContainer from "@/components/MainScreenContainer";
import { SleepRecords } from "@/components/storage/SaveChildren";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import { ChartColumn, Eye, EyeClosed } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RecordType = {
  label: string;
  time: string; // HH:MM
  date: string; // DD.MM.
};

export default function Sleep() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [minutesSinceAwake, setMinutesSinceAwake] = useState<number | null>(null);
  const [minutesSinceSleep, setMinutesSinceSleep] = useState<number | null>(null);
  const [mode, setMode] = useState<"awake" | "sleep" | "">("");
  const router = useRouter();
  const { selectedChild } = useChild();
  const { allChildren, selectedChildIndex, saveAllChildren } = useChild();

  const clearState = () => {
    setMode("");
    setMinutesSinceAwake(null);
    setMinutesSinceSleep(null);
  };
  
  const addRecord = async (label: string, newMode: "awake" | "sleep") => {
    if (!selectedChild) return;

    const now = new Date();

    const time = now.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const date = now.toLocaleDateString("cs-CZ");

    const newRecord: SleepRecords = { date, time, state: newMode };

    setRecords((prev) => [...prev, { label, time, date }]);
    setMode(newMode);

    handleSaveSleep(newRecord);
  };

    const handleSaveSleep = (newRecord: SleepRecords) => {
      if (selectedChildIndex === null) return;

      const updatedChildren = [...allChildren];
      const child = updatedChildren[selectedChildIndex];
      child.sleepRecords = [...(child.sleepRecords || []), newRecord];

      saveAllChildren(updatedChildren);
    };

  useEffect(() => {
    if (selectedChild && selectedChild.sleepRecords) {
      setRecords(
        selectedChild.sleepRecords.map((rec) => ({
          label: rec.state === "sleep" ? "Spánek od:" : "Vzhůru od:",
          time: rec.time,
          date: rec.date,
        }))
      );
    }
  }, [selectedChild]);

  // Přepočet časů od posledního záznamu
  useEffect(() => {
    const now = new Date();

    const lastAwake = [...records]
      .reverse()
      .find((r) => r.label.startsWith("Vzhůru"));
    const lastSleep = [...records]
      .reverse()
      .find((r) => r.label.startsWith("Spánek"));

    if (lastAwake) {
      const [h, m] = lastAwake.time.split(":").map(Number);
      const diff =
        Math.floor((now.getHours() * 60 + now.getMinutes()) - (h * 60 + m));
      setMinutesSinceAwake(diff >= 0 ? diff : diff + 24 * 60);
    } else {
      setMinutesSinceAwake(null);
    }

    if (lastSleep) {
      const [h, m] = lastSleep.time.split(":").map(Number);
      const diff =
        Math.floor((now.getHours() * 60 + now.getMinutes()) - (h * 60 + m));
      setMinutesSinceSleep(diff >= 0 ? diff : diff + 24 * 60);
    } else {
      setMinutesSinceSleep(null);
    }
  }, [records]);

  const grouped = Object.entries(
    records.reduce((acc, rec) => {
      if (!acc[rec.date]) acc[rec.date] = [];
      acc[rec.date].push(rec);
      return acc;
    }, {} as Record<string, RecordType[]>)
  ).map(([date, recs]) => {
    const sorted = [...recs].sort((a, b) => {
      const [ha, ma] = a.time.split(":").map(Number);
      const [hb, mb] = b.time.split(":").map(Number);
      return ha * 60 + ma - (hb * 60 + mb);
    });

    let totalSleepMinutes = 0;

    const enhanced = sorted.map((r, idx) => {
      let extra = "";

      if (r.label.startsWith("Spánek")) {
        const next = sorted[idx + 1];
        if (next && next.label.startsWith("Vzhůru")) {
          const [h1, m1] = r.time.split(":").map(Number);
          const [h2, m2] = next.time.split(":").map(Number);
          const minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (minutes > 0) {
            totalSleepMinutes += minutes;
            extra = ` (Délka: ${Math.floor(minutes / 60)}h ${minutes % 60}m)`;
          }
        }
      }

      if (r.label.startsWith("Vzhůru")) {
        const prev = sorted[idx - 1];
        if (prev && prev.label.startsWith("Vzhůru")) {
          const [h1, m1] = prev.time.split(":").map(Number);
          const [h2, m2] = r.time.split(":").map(Number);
          const minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (minutes > 0) {
            extra = ` (bdění: ${Math.floor(minutes / 60)}h ${minutes % 60}m)`;
          }
        }
      }

      return { ...r, extra };
    });

    return {
      date,
      totalSleepMinutes,
      records: enhanced,
    };
  });

    return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/sleep-add" />
      </CustomHeader>

      <Title style={{ marginTop: 40 }}>Spánek</Title>

      <View style={styles.buttonsRow}>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: "#fff" },
            mode === "awake" && styles.eyeButtonSelected,
          ]}
          onPress={() => addRecord("Vzhůru od:", "awake")}
        >
          <Eye color="black" size={28} />
        </Pressable>

        <Pressable
          style={[
            styles.button,
            { backgroundColor: "#000" },
            mode === "sleep" && styles.eyeButtonSelected,
          ]}
          onPress={() => addRecord("Spánek od:", "sleep")}
        >
          <EyeClosed color="white" size={28} />
        </Pressable>
      </View>
      {mode && (
        <View style = {{marginBottom: 20}}>
          <Text style={styles.counterText}>
            {mode === "sleep" && minutesSinceSleep !== null &&
              `Spánek: ${minutesSinceSleep} min`}
            {mode === "awake" && minutesSinceAwake !== null &&
              `Bdění: ${minutesSinceAwake} min`}
          </Text>
          
          <Pressable
              style={styles.deleteModeButton}
              onPress={clearState}
          >
              <Text style={styles.buttonText}>Vymazat stav</Text>
          </Pressable>
        </View>
      )}
      <View>
        {grouped.map(({ date, totalSleepMinutes, records }) => {
          let sleepCounter = 0;
          return (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.row}>
              {isEditMode && (
                <EditPencil
                  targetPath={`/actions/sleep-edit?date=${encodeURIComponent(date)}`}
                  color="#bf5f82"
                />
              )}
              <Text style={styles.dateTitle}>
                {date} 
              </Text>
              </View>
              <View style={{ marginLeft: 20 }}>
              {records.map((r, idx) => {
                if (r.label.startsWith("Spánek")) {
                  sleepCounter++;
                  return (
                    <Text key={idx} style={styles.record}>
                      {sleepCounter}. {r.label} {r.time} {r.extra}
                    </Text>
                  );
                } else {
                  return (
                    <Text key={idx} style={styles.record}>
                      {r.label} {r.time} {r.extra}
                    </Text>
                  );
                }
              })}
              </View>
              <Text style={styles.dateText}>
                Celková doba spánku:{" "}
                {Math.floor(totalSleepMinutes / 60)}h {totalSleepMinutes % 60}m
              </Text>
            </View>
          );
        })}
      </View>
      <Pressable
          style={styles.statisticButton}
          onPress={() => router.push({ pathname: "/actions" })}
      >
          <ChartColumn color="white" size={28} />
      </Pressable>
      <EditPencil
        onPress={() => setIsEditMode(!isEditMode)}
        color="white"
        circle
        editMode={isEditMode}
      />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  eyeButtonSelected: {
    borderColor: "#993769",
    borderWidth: 2,
  },
  deleteModeButton: {
    width: 150,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgb(164, 91, 143)",
    alignSelf: "center",
    marginTop: 20
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  statisticButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: "rgb(164, 91, 143)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 10,
    position: "absolute",
    bottom: 25,
    left: 30,
  },
  counterText: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
  dateGroup: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dateTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 16,
  },
  dateText: {
    marginTop: 10,
    fontSize: 16,
  },
  record: {
    fontSize: 15,
    paddingVertical: 2,
  },
  row: {
    flexDirection: "row",
    gap: 5,
  }
});
