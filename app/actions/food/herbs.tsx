import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import LookUp from "@/components/LookUpButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { HERBS } from "@/data/food/herbs";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function Herbs() {
  const [selectedFood, setSelectedFood] = useState<null | string>(null);
  const { selectedChild, selectedChildIndex, allChildren, saveAllChildren } = useChild();
  
  const handleDateChange = async (foodLabel: string, date: Date) => {
    if (selectedChildIndex === null) return;

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];

    const isoDate = date.toISOString().slice(0, 10);
    const updatedFoodDates = {
      ...(child.foodDates || {}),
      [foodLabel]: isoDate,
    };

    updatedChildren[selectedChildIndex] = {
      ...child,
      foodDates: updatedFoodDates,
    };

    await saveAllChildren(updatedChildren);
  };

  const handleDateDelete = async () => {
    if (selectedChildIndex === null || !selectedFood) return;

    const updatedChildren = [...allChildren];
    const child = updatedChildren[selectedChildIndex];

    // Odstraň položku z foodDates
    const { [selectedFood]: _, ...remainingFoodDates } = child.foodDates || {};
    updatedChildren[selectedChildIndex] = {
      ...child,
      foodDates: remainingFoodDates,
    };

    await saveAllChildren(updatedChildren);
    };

  const getChildAgeInMonths = (): number => {
    if (!selectedChild?.birthDate) return 0;

    const birth = new Date(selectedChild.birthDate);
    const now = new Date();

    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const totalMonths = years * 12 + months;

    return totalMonths >= 0 ? totalMonths : 0;
  };  

  return (
    <MainScreenContainer scrollable>
      <CustomHeader backTargetPath="/actions/food">
          <LookUp
            list={HERBS.map(item => ({
              ...item,
              buttonStyle: !!selectedChild?.foodDates?.[item.label]
                ? styles.buttonIntroduced
                : getChildAgeInMonths() >= item.month
                ? styles.buttonSuggested
                : styles.buttonFuture
            }))}
            getButtonStyle={(item) =>
              typeof item === "string" ? {} : item.buttonStyle
            }
            onSelect={(label) => setSelectedFood(label)}
          />
      </CustomHeader>
      <Title>Bylinky</Title>
      <Text style={styles.sectionTitle}> Zavedeno </Text>
      <View style={styles.sectionContainer}>
        {HERBS.map((item, index) => {
          const isIntroduced = !!selectedChild?.foodDates?.[item.label];
          return isIntroduced && (
            <Pressable 
              key={index}
              style={[styles.button, styles.buttonIntroduced]}              
              onPress={() => setSelectedFood(item.label)}
            >
              <Text style={styles.buttonText}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Modal
        visible={!!selectedFood}
        transparent={true}
        animationType="slide"
      >
        {selectedFood && (
          <View style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}>
            <View style={styles.dateSelectorBox}>
              <View style={styles.titleRow}>
                <Subtitle style={{color:"#993769", marginTop: -10}}>
                  {selectedFood}
                </Subtitle>
                <DateSelector
                  date={
                    selectedChild?.foodDates?.[selectedFood]
                      ? new Date(selectedChild.foodDates[selectedFood])
                      : new Date()
                  }
                  onChange={(date) => handleDateChange(selectedFood, date)}
                />
              </View>
              {selectedChild?.foodDates?.[selectedFood] && (
                <View style={styles.row}>
                  <Pressable
                    onPress={handleDateDelete}
                  >
                    <Text style={{ fontSize: 14 }}>🚮</Text>
                  </Pressable>
                  <Text style={styles.dateText}>
                    Datum zavedení:{" "}
                    {new Date(selectedChild.foodDates[selectedFood]).toLocaleDateString("cs-CZ")}
                  </Text>
                </View>
              )}
              <Pressable onPress={() => setSelectedFood(null)}>
                <Text style={styles.closeText}>Zavřít</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
      <Text style={styles.sectionTitle}> Navrženo dle věku </Text>
      <View style={styles.sectionContainer}>
        {HERBS.filter((item) => {
          const ageInMonths = getChildAgeInMonths();
          const isIntroduced = !!selectedChild?.foodDates?.[item.label];

          return !isIntroduced && item.month <= ageInMonths;
        }).map((item, index) => (
          <Pressable
            key={index}
            style={[styles.button, styles.buttonSuggested]}    
            onPress={() => setSelectedFood(item.label)}
          >
            <Text style={styles.buttonText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sectionTitle}> Ostatní </Text>
      <View style={styles.sectionContainer}>
        {HERBS.filter((item) => {
          const ageInMonths = getChildAgeInMonths();
          const isIntroduced = !!selectedChild?.foodDates?.[item.label];

          return !isIntroduced && item.month > ageInMonths;
        }).map((item, index) => (
          <Pressable
            key={index}
            style={[styles.button, styles.buttonFuture]}
            onPress={() => setSelectedFood(item.label)}
          >
            <Text style={styles.buttonText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: "#f9f9f9",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 15,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#4d4d4d",
  },
  button: {
    backgroundColor: "rgba(233, 205, 225, 1)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 10,
    width: "48%", // dvě tlačítka vedle sebe s mezerou
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIntroduced: {
    backgroundColor: "#d4f1d4",
  },
  buttonSuggested: {
    backgroundColor: "#fff6c4",
  },
  buttonFuture: {
    backgroundColor: "#e6e6e6",
  },
  buttonText: {
    color: "#333",
    fontSize: 16,
    textAlign: "center",
    flexWrap: "wrap",
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
    marginTop: 10,
    marginBottom: 20,
  },
  modalTitle: {
    marginBottom: 10,
    color: "#993769",
  },
  dateText: {
    color: "#993769",
    fontWeight: "500",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  closeText: {
    color: "#741212ff",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    gap: 5,
  }
});