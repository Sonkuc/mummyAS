import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Teeth() {
  const [selectedTooth, setSelectedTooth] = useState<null | string>(null);
  const [dates, setDates] = useState<Record<string, string>>({});
  const { selectedChild, selectedChildIndex, allChildren, saveAllChildren } = useChild();

  const teeth = [
    { id: "U1", name: "Levý prostřední řezák", x: "42.7%", y: "6.7%", jaw: "upper"},
    { id: "U2", name: "Pravý prostřední řezák", x: "56.6%", y: "7.1%", jaw: "upper"},
    { id: "U3", name: "Levý postranní řezák", x: "30.3%", y: "14.3%", jaw: "upper"},
    { id: "U4", name: "Pravý postranní řezák", x: "69.9%", y: "15%", jaw: "upper"},
    { id: "U5", name: "Levý špičák", x: "21.9%", y: "31.4%", jaw: "upper"},
    { id: "U6", name: "Pravý špičák", x: "78.7%", y: "30.4%", jaw: "upper"},
    { id: "U7", name: "Levá první stolička", x: "12.3%", y: "52.7%", jaw: "upper"},
    { id: "U8", name: "Pravá první stolička", x: "86.3%", y: "54.6%", jaw: "upper"},
    { id: "U9", name: "Levá druhá stolička", x: "7.9%", y: "84.8%", jaw: "upper"},
    { id: "U10", name: "Pravá druhá stolička", x: "91.6%", y: "84.3%", jaw: "upper"},

    { id: "L1", name: "Levý prostřední řezák", x: "42.5%", y: "92.2%", jaw: "lower" },
    { id: "L2", name: "Pravý prostřední řezák", x: "56.8%", y: "93.1%", jaw: "lower" },
    { id: "L3", name: "Pravý postranní řezák", x: "70.1%", y: "84.3%", jaw: "lower" },
    { id: "L4", name: "Levý postranní řezák", x: "30.1%", y: "86.0%", jaw: "lower" },
    { id: "L5", name: "Pravý špičák", x: "77.9%", y: "69.8%", jaw: "lower" },
    { id: "L6", name: "Levý špičák", x: "21.9%", y: "72.0%", jaw: "lower" },
    { id: "L7", name: "Pravá první stolička", x: "86.1%", y: "46.6%", jaw: "lower" },
    { id: "L8", name: "Levá první stolička", x: "12.6%", y: "48.5%", jaw: "lower" },
    { id: "L9", name: "Pravá druhá stolička", x: "92.3%", y: "18.1%", jaw: "lower" },
    { id: "L10", name: "Levá druhá stolička", x: "7.2%",  y: "16.9%", jaw: "lower" }
  ];

  const handleDateChange = async (toothId: string, date: Date) => {
    if (selectedChildIndex === null) return;

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];

    const isoDate = date.toISOString().slice(0, 10);
    const updatedTeethDates = {
      ...(child.teethDates || {}),
      [toothId]: isoDate,
    };

    updatedChildren[selectedChildIndex] = {
      ...child,
      teethDates: updatedTeethDates,
    };

    await saveAllChildren(updatedChildren);
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions" />
      <Title style={{marginTop: 40}}>Moje zoubky</Title>
      
      <Subtitle>Horní patro</Subtitle>
      <View style={styles.imageWrapper}>  
        <Image
          source={require("@/assets/images/teethA.png")}
          style={styles.teethImage}
        />
        {teeth.filter(t => t.jaw === "upper").map((tooth) => (
          <TouchableOpacity
            key={tooth.id}
            style={[
              styles.toothHotspot,
              { left: tooth.x, top: tooth.y },
            ]}
            onPress={() =>
              setSelectedTooth(tooth.id)}/>
        ))}
      </View>

      <Subtitle>Dolní patro</Subtitle>
      <View style={styles.imageWrapper}>
        <Image
          source={require("@/assets/images/teethB.png")}
          style={styles.teethImage}
        />
        {teeth.filter(t => t.jaw === "lower").map((tooth) => (
          <TouchableOpacity
            key={tooth.id}
            style={[
              styles.toothHotspot,
              { left: tooth.x, top: tooth.y },
            ]}
            onPress={() =>
              setSelectedTooth(tooth.id)}/>
        ))}
      </View>

      {selectedTooth && (
        <View style={styles.dateSelectorBox}>
          <View style={styles.titleRow}>
            <Subtitle style={styles.modalTitle}>
              {teeth.find(t => t.id === selectedTooth)?.name}
            </Subtitle>
            <DateSelector
              date={
                selectedChild?.teethDates?.[selectedTooth]
                  ? new Date(selectedChild.teethDates[selectedTooth])
                  : new Date()
              }
              onChange={(date) => {
                handleDateChange(selectedTooth, date);
              }}
            />
          </View>
          {selectedChild?.teethDates?.[selectedTooth] && (
            <Text style={styles.dateText}>
              Datum prořezání: {new Date(selectedChild.teethDates[selectedTooth]).toLocaleDateString("cs-CZ")}
            </Text>
          )}
        </View>
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
    marginBottom: 50,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  toothHotspot: {
    position: "absolute",
    width: 30,
    height: 30,
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
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitle: {
    marginBottom: 10,
    color: "#993769",
  },
  dateText: {
    marginTop: 10,
    color: "#993769",
    fontWeight: "500",
  },
});
