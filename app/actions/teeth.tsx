import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import { createTeethRecord, deleteTeethRecord } from "@/components/storage/api";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Teeth() {
  const [selectedTooth, setSelectedTooth] = useState<null | string>(null);
  const { reloadChildren, selectedChildId, allChildren } = useChild();
  
  const selectedChild = useMemo(() => 
    allChildren.find(c => c.id === selectedChildId),
    [allChildren, selectedChildId]
  );

  const teeth = [
    { id: "U1", name: "Levý prostřední řezák", x: "36.7%", y: "8.7%", jaw: "upper"},
    { id: "U2", name: "Pravý prostřední řezák", x: "50.6%", y: "9.1%", jaw: "upper"},
    { id: "U3", name: "Levý postranní řezák", x: "24.3%", y: "14.3%", jaw: "upper"},
    { id: "U4", name: "Pravý postranní řezák", x: "63.9%", y: "15%", jaw: "upper"},
    { id: "U5", name: "Levý špičák", x: "15.9%", y: "31.4%", jaw: "upper"},
    { id: "U6", name: "Pravý špičák", x: "72.7%", y: "30.4%", jaw: "upper"},
    { id: "U7", name: "Levá první stolička", x: "8.3%", y: "52.7%", jaw: "upper"},
    { id: "U8", name: "Pravá první stolička", x: "78.3%", y: "54.6%", jaw: "upper"},
    { id: "U9", name: "Levá druhá stolička", x: "2.9%", y: "82.8%", jaw: "upper"},
    { id: "U10", name: "Pravá druhá stolička", x: "83.6%", y: "84.3%", jaw: "upper"},

    { id: "L1", name: "Levý prostřední řezák", x: "36.7%", y: "92.2%", jaw: "lower" },
    { id: "L2", name: "Pravý prostřední řezák", x: "50.6%", y: "93.1%", jaw: "lower" },
    { id: "L3", name: "Pravý postranní řezák", x: "63.9%", y: "84.3%", jaw: "lower" },
    { id: "L4", name: "Levý postranní řezák", x: "24.3%", y: "86.0%", jaw: "lower" },
    { id: "L5", name: "Pravý špičák", x: "72.7%", y: "69.8%", jaw: "lower" },
    { id: "L6", name: "Levý špičák", x: "15.9%", y: "72.0%", jaw: "lower" },
    { id: "L7", name: "Pravá první stolička", x: "78.3%", y: "46.6%", jaw: "lower" },
    { id: "L8", name: "Levá první stolička", x: "8.3%", y: "48.5%", jaw: "lower" },
    { id: "L9", name: "Pravá druhá stolička", x: "83.6%", y: "18.1%", jaw: "lower" },
    { id: "L10", name: "Levá druhá stolička", x: "2.9%",  y: "16.9%", jaw: "lower" }
  ];

  // Převede pole [ {tooth_id: "U1", date: "..."}, ... ] na objekt { "U1": "..." }
  const toothMap = useMemo(() => {
    const map: Record<string, string> = {};
    selectedChild?.teethRecords?.forEach((record: any) => {
      map[record.tooth_id] = record.date;
    });
    return map;
  }, [selectedChild]);

  const handleDateChange = async (toothId: string, date: Date) => {
    if (!selectedChild) return;
    
    // Zajištění, že bereme datum podle lokálního času, ne UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localIsoDate = `${year}-${month}-${day}`;

    try {
      await createTeethRecord(selectedChild.id, {
        tooth_id: toothId,
        date: localIsoDate
      });
      await reloadChildren();
    } catch (error) {
      console.error("Chyba při ukládání zubu:", error);
    }
  };

  const handleDateDelete = async () => {
    if (!selectedChild || !selectedTooth) return;

    // Najdeme v datech z backendu ten konkrétní záznam pro daný zub, abychom znali jeho ID
    const recordToDelete = selectedChild.teethRecords?.find(
      (r: any) => r.tooth_id === selectedTooth
    );

    if (!recordToDelete) return;

    try {
      // Smažeme podle technického ID (UUID)
      await deleteTeethRecord(selectedChild.id, recordToDelete.id);
      await reloadChildren();
      setSelectedTooth(null); // Zavřeme detail zubu
    } catch (error) {
      console.error("Chyba při mazání zubu:", error);
    }
  };

  const TeethJawSection = ({ jaw, label }: { jaw: "upper" | "lower", label: string }) => (
    <GroupSection>
      <Subtitle style={{ marginLeft: 10, marginTop: 5, marginBottom: -5 }}>{label}</Subtitle>
      <View style={styles.imageWrapper}>
        <Image
          source={jaw === "upper"
            ? require("@/assets/images/teethA.png")
            : require("@/assets/images/teethB.png")}
          style={styles.teethImage}
        />
        {teeth.filter(t => t.jaw === jaw).map(tooth => (
          <TouchableOpacity
            key={tooth.id}
            style={[styles.toothHotspot, { left: tooth.x, top: tooth.y } as any ]}
            onPress={() => setSelectedTooth(tooth.id)}
          />
        ))}
      </View>
    </GroupSection>
  );

  const currentToothDate = useMemo(() => {
    // Pokud zub existuje v mapě, použijeme jeho datum
    if (selectedTooth && toothMap[selectedTooth]) {
      const d = new Date(toothMap[selectedTooth]);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    // Pokud ne, nastavíme dnešek
    return new Date();
  }, [selectedTooth, toothMap]); // toothMap se změní až po reloadChildren()

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions" />
      <Title>Moje zoubky</Title>
      <TeethJawSection jaw="upper" label="Horní patro" />
      <TeethJawSection jaw="lower" label="Dolní patro" />
      {selectedTooth && (
        <GroupSection style={styles.dateSelectorBox}>
          <View style={styles.titleRow}>
            <Subtitle>
              {teeth.find(t => t.id === selectedTooth)?.name}
            </Subtitle>
            <DateSelector
              date={currentToothDate}
              onChange={(date) => handleDateChange(selectedTooth!, date)}
              birthISO={selectedChild?.birthDate}
            />
          </View>
          {toothMap[selectedTooth] && (
            <View style={styles.row}>
              <Pressable onPress={handleDateDelete}>
                <Text style={{ fontSize: 14 }}>🚮</Text>
              </Pressable>
              <Text style={styles.dateText}>
                Datum prořezání: {new Date(toothMap[selectedTooth]).toLocaleDateString("cs-CZ")}
              </Text>
            </View>
          )}
        </GroupSection>
      )}
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    position: "relative",
    alignSelf: "center",
    width: 300,
    height: 200,
    marginBottom: 30,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", 
    marginRight: 5,
  },
  toothHotspot: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  teethImage: {
    width: undefined,
    height: "100%",
    resizeMode: "contain",
    marginTop: 20,
  },
  dateSelectorBox: {
    maxWidth: 280,
    width: "90%",
    alignSelf: "center"
  },
  dateText: {
    color: COLORS.primary,
    fontWeight: "500",
    flexShrink: 1,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
