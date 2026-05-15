import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AddButton from "./AddButton";
import CustomHeader from "./CustomHeader";
import GroupSection from "./GroupSection";
import LookUp from "./LookUpButton";
import MainScreenContainer from "./MainScreenContainer";
import MyTextInput from "./MyTextInput";
import Note from "./Note";
import { FoodRecord, FoodRecordUpdate } from "./storage/interfaces";
import Subtitle from "./Subtitle";
import Title from "./Title";
import ValidatedDateInput from "./ValidDateInput";

type FoodItem = {
  label: string;
  month: number;
};

type Props = {
  title: string;
  categoryKey: string;
  dataList: FoodItem[];
};

export default function FoodCategoryScreen({ title, categoryKey, dataList }: Props) {
  const { selectedChild, updateFoodRecord, deleteFoodRecord } = useChild();
  const [selectedFood, setSelectedFood] = useState<null | string>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFoodLabel, setNewFoodLabel] = useState("");

  // --- POMOCNÝ FINDER ---
  const getRecord = (label: string) => 
    selectedChild?.foodRecords?.find(r => r.food_name === label);

  // --- JEDNOTNÁ FUNKCE PRO UKLÁDÁNÍ ---
  const saveFoodData = async (label: string, updates: FoodRecordUpdate) => {
    if (!selectedChild) return;

    const currentRecords = selectedChild.foodRecords || [];
    const existingRecord = currentRecords.find(r => r.food_name === label);

    let updatedRecords: FoodRecord[];

    if (existingRecord) {
      updatedRecords = currentRecords.map(r => 
        r.food_name === label 
          ? { 
              ...r, 
              ...updates, 
              // Vždy zajistíme, že kategorie odpovídabledu, pokud tam už není
              category: r.category || (categoryKey as any) 
            } 
          : r
      );
    } else {
      const newRecord: FoodRecord = {
        id: `local-${Date.now()}`,
        child_id: selectedChild.id,
        food_name: label,
        category: categoryKey as any, 
        date: updates.date || "",
        note: updates.note || ""
      };
      updatedRecords = [...currentRecords, newRecord];
    }

    await updateFoodRecord(selectedChild.id, updatedRecords);
  };

  const renderFoodItem = (label: string, buttonStyle: any) => {
    const record = getRecord(label);
    const words = label.split(" ");

    return (
      <View key={label} style={styles.itemWrapper}>
        <Pressable 
          style={[styles.button, buttonStyle]} 
          onPress={() => setSelectedFood(label)}
        >
          <View style={styles.buttonContentWrapper}>
            {/* Ikona poznámky */}
            <View style={styles.noteWrapper}>
              <Note 
                initialText={record?.note || ""}
                onSave={(text) => saveFoodData(label, { note: text })}
              />
            </View>

            {/* Jednotlivá slova jako samostatné Text prvky */}
            {words.map((word, index) => (
              <Text key={index} style={styles.buttonText}>
                {word}{index < words.length - 1 ? " " : ""}
              </Text>
            ))}
          </View>
        </Pressable>
      </View>
    );
  };
  
  const getChildAgeInMonths = (): number => {
    if (!selectedChild?.birthDate) return 0;
    const birth = new Date(selectedChild.birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) months -= 1;
    return Math.max(0, years * 12 + months);
  };

  // 1. Zavedená jídla (mají datum a patří do této kategorie nebo dataListu)
  const introducedFoods = (selectedChild?.foodRecords || [])
    .filter(r => r.date && r.date.trim() !== "" && (
      dataList.some(item => item.label === r.food_name) || 
      r.category === categoryKey
    ));

  const introducedNames = new Set(introducedFoods.map(r => r.food_name));

  // 2. Moje: Nemá datum, patří sem, není v dataListu a NENÍ už v zavedených
  const myFoods = (selectedChild?.foodRecords || [])
    .filter(r => 
      (!r.date || r.date.trim() === "") && 
      r.category === categoryKey && 
      !dataList.some(d => d.label === r.food_name) &&
      !introducedNames.has(r.food_name)
    );
    
  const suggestedFoods = dataList.filter(item => 
    !introducedNames.has(item.label) && getChildAgeInMonths() >= item.month
  );

  const futureFoods = dataList.filter(item => 
    !introducedNames.has(item.label) && getChildAgeInMonths() < item.month
  );

  // Změna data (Ukládání na backend)
  const handleDateChange = async (foodLabel: string, date: Date | string) => {
    const isoDate = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
    
    const record = getRecord(foodLabel);
    if (record?.date === isoDate) return;

    await saveFoodData(foodLabel, { date: isoDate });
  };

  // Smazání data (Prázdný string nebo null)
  const handleDateDelete = async () => {
    if (!selectedFood) return;
    await saveFoodData(selectedFood, { date: "" });
    setSelectedFood(null);
  };

  const modalAdd = () => {
    setNewFoodLabel("");
    setShowAddModal(true);
  };

  // 4. Přidání nové potraviny
  const handleAddNewFood = async () => {
    const label = newFoodLabel.trim();
    if (!label) return;

    await saveFoodData(label, { date: "" });
    setShowAddModal(false);
    setNewFoodLabel("");
  };

  const handleFullDelete = async () => {
    if (!selectedFood || !selectedChild) return;

    try {
      await deleteFoodRecord(selectedChild.id, selectedFood);
      setSelectedFood(null); 
    } catch (err) {
      console.error("Chyba při mazání potraviny:", err);
    }
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/food">
        <LookUp
          list={dataList.map(item => {
            const record = getRecord(item.label);
            return {
              ...item,
              buttonStyle: !!record?.date
                ? styles.buttonIntroduced
                : getChildAgeInMonths() >= item.month
                ? styles.buttonSuggested
                : styles.buttonFuture
            };
          })}
          getButtonStyle={item => typeof item === "string" ? {} : item.buttonStyle}
          onSelect={label => setSelectedFood(label)}
        />
      </CustomHeader>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>{title}</Title>

        <Subtitle> Zavedeno </Subtitle>
        <GroupSection style={styles.sectionContainer}>
          {introducedFoods.map((record) => renderFoodItem(record.food_name, styles.buttonIntroduced))}
        </GroupSection>

        <Subtitle> Navrženo dle věku </Subtitle>
        <GroupSection style={styles.sectionContainer}>
          {suggestedFoods.map(item => renderFoodItem(item.label, styles.buttonSuggested))}
        </GroupSection>

        <Subtitle> Ostatní </Subtitle>
        <GroupSection style={styles.sectionContainer}>
          {futureFoods.map(item => renderFoodItem(item.label, styles.buttonFuture))}
        </GroupSection>

        <Subtitle> Moje </Subtitle>
        <GroupSection style={styles.sectionContainer}>
          {myFoods.map(record => renderFoodItem(record.food_name, styles.buttonCreated))}
        </GroupSection>
      </ScrollView>

      <AddButton
        onPress={modalAdd}
        style={{
          bottom: 30,
          top: undefined,
          right: undefined,
          alignSelf: "center",
        }}
      />

      {/* Modal přidání */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GroupSection style={styles.dateSelectorBox}>
            <Subtitle style={{ color: COLORS.primary }}>Přidat novou potravinu</Subtitle>
            <MyTextInput
              placeholder="Název potraviny"
              value={newFoodLabel}
              onChangeText={setNewFoodLabel}
              autoCapitalize="sentences"
            />
            <View style={styles.titleRow}>
              <Pressable onPress={handleAddNewFood}>
                <Text style={styles.closeText}>Uložit</Text>
              </Pressable>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={styles.uiButtonText}>
                Zavřít
              </Text>
              </Pressable>
            </View>
          </GroupSection>
        </View>
      </Modal>

      {/* Modal s datem */}
      <Modal visible={!!selectedFood} transparent animationType="slide">
        {selectedFood && (() => {
          const record = getRecord(selectedFood);
          return (
            <View style={styles.modalOverlay}>
              <GroupSection style={styles.dateSelectorBox}>
                <View style={styles.titleRow}>
                  <Subtitle style={{ color: COLORS.primary, marginTop: -10}}>{selectedFood}</Subtitle>
                  <View style={styles.datePickerContainer}>
                    <Text style={styles.label}>Datum zavedení (RRRR-MM-DD):</Text>
                    <ValidatedDateInput
                      value={record?.date || ""}
                      onChange={(newDate) => {
                        // Tady newDate už přichází jako validní string "YYYY-MM-DD"
                        if (newDate) handleDateChange(selectedFood, new Date(newDate));
                      }}
                      birthISO={selectedChild?.birthDate}
                      fallbackOnError="original"
                      originalValue={record?.date || ""}
                      placeholder="Např. 2024-05-20"
                    />
                  </View>
                </View>

                {/* Odstranění DATA */}
                {record?.date && (
                  <View style={styles.row}>
                    <Pressable onPress={handleDateDelete}>
                      <Text style={{ fontSize: 14, marginRight: 5 }}>🚮</Text>
                    </Pressable>
                    <Text style={styles.dateText}>
                      Datum zavedení: {new Date(record.date).toLocaleDateString("cs-CZ")}
                    </Text>
                  </View>
                )}

                <View style= {styles.titleRow}>
                  {/* ÚPLNÉ SMAZÁNÍ potraviny */}
                  {!dataList.some(item => item.label === selectedFood) && (
                    <Pressable 
                      onPress={handleFullDelete} 
                      style={styles.uiButton}
                    >
                      <Text style={styles.uiButtonText}>
                        Smazat potravinu
                      </Text>
                    </Pressable>  
                  )}
                  
                  <Pressable 
                    onPress={() => setSelectedFood(null)} 
                    style={styles.uiButton}
                  >
                    <Text style={styles.uiButtonText}>
                      Zavřít
                    </Text>
                  </Pressable>
                </View>
              </GroupSection>
            </View>
          );
        })()}
      </Modal>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "flex-start", // Zarovnat od začátku
    paddingHorizontal: 10, // Drobný padding po stranách
  },
  itemWrapper: {
    width: "50%", 
    paddingHorizontal: 5, 
    marginBottom: 10, 
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonContentWrapper: {
    flexDirection: "row",      // Prvky řadíme vedle sebe
    flexWrap: "wrap",          // Když není místo, zalomíme
    justifyContent: "center",  
    alignItems: "center",      
  },
  noteWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },

  buttonIntroduced: { backgroundColor: COLORS.lightGreen },
  buttonSuggested: { backgroundColor: COLORS.lightYellow },
  buttonFuture: { backgroundColor: COLORS.lightGrey },
  buttonCreated: { backgroundColor: COLORS.lightPurple },
  
  buttonText: { 
    fontSize: 16, 
    fontWeight: "500",
    textAlign: "center",
  },

  dateSelectorBox: { marginHorizontal: 20, marginTop: 10, marginBottom: 20, width: "80%", maxWidth: 400 },
  closeText: { color: COLORS.darkRedText, fontSize: 15, fontWeight: "bold", textAlign: "right" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  dateText: { color: COLORS.primary, fontWeight: "500" },
  row: { flexDirection: "row", marginBottom: 30, marginTop: -20 },

  deleteAction: {
    alignItems: "center",
    padding: 10,
  },
  uiButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGrey,
  },
  uiButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.darkRedText,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  datePickerContainer: {
    marginVertical: 15,
    width: "100%",
  },
});