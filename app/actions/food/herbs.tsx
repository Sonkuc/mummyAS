import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import GroupSection from "@/components/GroupSection";
import LookUp from "@/components/LookUpButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { HERBS } from "@/data/food/herbs";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (now.getDate() < birth.getDate()) {
      months -= 1;
    }

    const totalMonths = years * 12 + months;
    return totalMonths >= 0 ? totalMonths : 0;
  };

  return (
    <MainScreenContainer>
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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Bylinky</Title>
        <Subtitle> Zavedeno </Subtitle>
        <GroupSection style={styles.sectionContainer}>
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
        </GroupSection>
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
              alignItems: "center",
            }}>
              <GroupSection style={styles.dateSelectorBox}>
                <View style={styles.titleRow}>
                  <Subtitle style={{color:COLORS.primary, marginTop: -10, marginLeft: 10}}>
                    {selectedFood}
                  </Subtitle>
                  <DateSelector
                    date={
                      selectedChild?.foodDates?.[selectedFood]
                        ? new Date(selectedChild.foodDates[selectedFood])
                        : new Date()
                    }
                    onChange={(date) => handleDateChange(selectedFood, date)}
                    birthISO={selectedChild ? selectedChild.birthDate : null}
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
              </GroupSection>
            </View>
          )}
        </Modal>
        <Subtitle> Navrženo dle věku </Subtitle>
        <GroupSection style={styles.sectionContainer}>
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
        </GroupSection>
        <Subtitle> Ostatní </Subtitle>
        <GroupSection style={styles.sectionContainer}>
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
        </GroupSection>
      </ScrollView>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 10,
    width: "48%", // dvě tlačítka vedle sebe s mezerou
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIntroduced: {
    backgroundColor: COLORS.lightGreen,
  },
  buttonSuggested: {
    backgroundColor: COLORS.lightYellow,
  },
  buttonFuture: {
    backgroundColor: COLORS.lightGrey,
  },
  buttonText: {
    fontSize: 16,
    textAlign: "center",
    flexWrap: "wrap",
  },
  dateSelectorBox: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    width: "80%", 
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: 10,
    color: COLORS.primary,
  },
  dateText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeText: {
    color: COLORS.darkRedText,
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
  }
});