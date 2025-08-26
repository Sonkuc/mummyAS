import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Teeth() {
  const [selectedTooth, setSelectedTooth] = useState<null | string>(null);
  const { selectedChild, selectedChildIndex, allChildren, saveAllChildren } = useChild();

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

  const handleDateDelete = async () => {
    if (selectedChildIndex === null || !selectedTooth) return;

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];

    const { [selectedTooth]: _, ...remainingToothDates } = child.teethDates || {};
    updatedChildren[selectedChildIndex] = {
      ...child,
      teethDates: remainingToothDates,
    };

    await saveAllChildren(updatedChildren);
    };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions" />
      <Title>Moje zoubky</Title>
      
      <GroupSection>
        <Subtitle style={{marginLeft: 10, marginTop: 5, marginBottom: -5}}>Horní patro</Subtitle>
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
      </GroupSection>
      <GroupSection>
        <Subtitle style={{marginLeft: 10, marginTop: 5, marginBottom: -5}}>Dolní patro</Subtitle>
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
      </GroupSection>
      {selectedTooth && (
        <GroupSection style={styles.dateSelectorBox}>
          <View style={styles.titleRow}>
            <Subtitle style={{color: "#993769"}}>
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
            <View style={styles.row}>
              <Pressable style={{ justifyContent: "center", marginRight: 8 }} onPress={handleDateDelete}>
                <Text style={{ fontSize: 14 }}>🚮</Text>
              </Pressable>
              <Text style={styles.dateText}>
                Datum prořezání:{" "}
                {new Date(selectedChild.teethDates[selectedTooth]).toLocaleDateString("cs-CZ")}
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
    gap: 5,
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
    color: "#993769",
    fontWeight: "500",
    flexShrink: 1,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
