import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AddButton from "./AddButton";
import CustomHeader from "./CustomHeader";
import DateSelector from "./DateSelector";
import GroupSection from "./GroupSection";
import LookUp from "./LookUpButton";
import MainScreenContainer from "./MainScreenContainer";
import MyTextInput from "./MyTextInput";
import Note from "./Note";
import Subtitle from "./Subtitle";
import Title from "./Title";

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
  const { selectedChild, updateChild } = useChild();
  const [selectedFood, setSelectedFood] = useState<null | string>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFoodLabel, setNewFoodLabel] = useState("");

  // --- JEDNOTNÁ FUNKCE PRO UKLÁDÁNÍ (Datum, Kategorie i Poznámka) ---
  const saveFoodData = async (label: string, updates: { date?: string, note?: string }) => {
    if (!selectedChild) return;

    // Všechny informace o jídle uložíme do těchto map pro bleskové UI
    const newFoodDates = { ...(selectedChild.foodDates || {}), ... (updates.date !== undefined ? { [label]: updates.date } : {}) };
    const newFoodNotes = { ...(selectedChild.foodNotes || {}), ... (updates.note !== undefined ? { [label]: updates.note } : {}) };
    const newFoodCategories = { ...(selectedChild.foodCategories || {}), [label]: categoryKey };

    try {
      await updateChild({
        ...selectedChild,
        foodDates: newFoodDates,
        foodNotes: newFoodNotes,
        foodCategories: newFoodCategories,
      });
    } catch (err) {
      console.error("Chyba při ukládání jídla:", err);
    }
  };

  const renderFoodItem = (label: string, buttonStyle: any) => (
    <View key={label} style={styles.row}>
      {/* Poznámka - naprosto stejná logika jako u spánku */}
      <Note 
        initialText={selectedChild?.foodNotes?.[label] || ""}
        onSave={(text) => saveFoodData(label, { note: text })}
      />
      
      <Pressable 
        style={[styles.button, buttonStyle]} 
        onPress={() => setSelectedFood(label)}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </View>
  );
  
  const getChildAgeInMonths = (): number => {
    if (!selectedChild?.birthDate) return 0;
    const birth = new Date(selectedChild.birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) months -= 1;
    return Math.max(0, years * 12 + months);
  };

  const introducedFoods = Object.entries(selectedChild?.foodDates || {})
    .filter(([_, date]) => !!date)
    .filter(([label]) => 
      dataList.some(item => item.label === label) || 
      selectedChild?.foodCategories?.[label] === categoryKey
    );

  const myFoods = Object.entries(selectedChild?.foodDates || {})
    .filter(([_, date]) => date === "")
    .filter(([label]) => selectedChild?.foodCategories?.[label] === categoryKey);

  const suggestedFoods = dataList.filter(item => {
    const date = selectedChild?.foodDates?.[item.label];
    return !date && getChildAgeInMonths() >= item.month;
  });

  const futureFoods = dataList.filter(item => {
    const date = selectedChild?.foodDates?.[item.label];
    return !date && getChildAgeInMonths() < item.month;
  });

  // 2. Změna data (Ukládání na backend)
  const handleDateChange = async (foodLabel: string, date: Date) => {
    const isoDate = date.toISOString().slice(0, 10);
      if (selectedChild?.foodDates?.[foodLabel] === isoDate) return;

    // 2. Async/Await: Počkej na výsledek uložení
    try {
        await saveFoodData(foodLabel, { date: isoDate });
    } catch (error) {
        console.error("Nepodařilo se změnit datum:", error);
    }
  };

  // 3. Smazání data (Nastavení na prázdný string nebo null)
  const handleDateDelete = async () => {
    if (!selectedFood) return;
    // Nastavením na prázdný string jídlo "od-zavedeme"
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

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/food">
        <LookUp
          list={dataList.map(item => ({
            ...item,
            buttonStyle: !!selectedChild?.foodDates?.[item.label]
              ? styles.buttonIntroduced
              : getChildAgeInMonths() >= item.month
              ? styles.buttonSuggested
              : styles.buttonFuture
          }))}
          getButtonStyle={item => typeof item === "string" ? {} : item.buttonStyle}
          onSelect={label => setSelectedFood(label)}
        />
      </CustomHeader>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>{title}</Title>

        <Subtitle> Zavedeno </Subtitle>
        <GroupSection style={styles.sectionContainer}>
          {introducedFoods.map(([label]) => renderFoodItem(label, styles.buttonIntroduced))}
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
          {myFoods.map(([label]) => (
            <Pressable key={label} style={[styles.button, styles.buttonCreated]} onPress={() => setSelectedFood(label)}>
              <Text style={styles.buttonText}>{label}</Text>
            </Pressable>
          ))}
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
                <Text style={styles.closeText}>Zavřít</Text>
              </Pressable>
            </View>
          </GroupSection>
        </View>
      </Modal>

      {/* Modal s datem */}
      <Modal visible={!!selectedFood} transparent animationType="slide">
        {selectedFood && (
          <View style={styles.modalOverlay}>
            <GroupSection style={styles.dateSelectorBox}>
              <View style={styles.titleRow}>
                <Subtitle style={{ color: COLORS.primary, marginTop: -10 }}>{selectedFood}</Subtitle>
                <DateSelector
                  date={
                    selectedChild?.foodDates?.[selectedFood]
                      ? new Date(selectedChild.foodDates[selectedFood])
                      : new Date()
                  }
                  onChange={date => handleDateChange(selectedFood, date)}
                  birthISO={selectedChild ? selectedChild.birthDate : null}
                />
              </View>
              {selectedChild?.foodDates?.[selectedFood] && (
                <View style={styles.row}>
                  <Pressable onPress={handleDateDelete}>
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
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 10,
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIntroduced: { backgroundColor: COLORS.lightGreen },
  buttonSuggested: { backgroundColor: COLORS.lightYellow },
  buttonFuture: { backgroundColor: COLORS.lightGrey },
  buttonCreated: { backgroundColor: COLORS.lightPurple },
  buttonText: { fontSize: 16, textAlign: "center", flexWrap: "wrap" },
  dateSelectorBox: { marginHorizontal: 20, marginTop: 10, marginBottom: 20, width: "80%", maxWidth: 400 },
  closeText: { color: COLORS.darkRedText, fontSize: 15, fontWeight: "bold", textAlign: "right" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  dateText: { color: COLORS.primary, fontWeight: "500" },
  row: { flexDirection: "row" },
});
