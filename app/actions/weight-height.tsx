import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import FilterButton from "@/components/FilterButton";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function WeightHeight() {
  const { selectedChild } = useChild();
  const [isEditMode, setIsEditMode] = useState(false);
  const [filters, setFilters] = useState<("weight" | "height" | "head" | "clothes" | "foot")[]>([
    "weight",
    "height",
    "head",
    "clothes",
    "foot",
  ]);

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split(".");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const sortedNotes = [...(selectedChild?.wh || [])].sort(
    (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
  );

    useEffect(() => {
    if (!selectedChild) return;

    const FILTERS_KEY = `filters-${selectedChild.id}`;

    const loadFilterSettings  = async () => {
      try {
        const storedFilters = await AsyncStorage.getItem(FILTERS_KEY);
        if (storedFilters !== null) {
          setFilters(JSON.parse(storedFilters));
        ;}
      } catch (e) {
        console.error("Chyba při načítání filtrů:", e);
      }
    };


    loadFilterSettings();
  }, [selectedChild]);

  useEffect(() => {
    if (!selectedChild) return;

    const FILTERS_KEY = `filters-${selectedChild.id}`;

    const saveFilters = async () => {
      try {
        await AsyncStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
      } catch (e) {
        console.error("Chyba při ukládání filtrů:", e);
      }
    };

    saveFilters();
  }, [filters]);

  function getLastValue(
    arr: { date: string; weight?: string; height?: string; head?: string }[],
    currentDate: string,
    field: "weight" | "height" | "head"
  ) {
    const currentTime = parseDate(currentDate).getTime();

    return arr
      .filter(
        (item) =>
          parseDate(item.date).getTime() < currentTime &&
          item[field] &&
          item[field]?.trim() !== ""
      )
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())[0]; // ⬅️ RETURN výsledku
  }

  function renderDifference(
    arr: { date: string; weight?: string; height?: string; head?: string }[],
    currentDate: string,
    field: "weight" | "height" | "head",
    unit: string
  ) {
    const currentEntry = arr.find(
      (item) =>
        item.date === currentDate &&
        item[field] &&
        item[field].trim() !== ""
    );
    if (!currentEntry || !currentEntry[field] || currentEntry[field].trim() === "") {
      return null;
    }

    const last = getLastValue(arr, currentDate, field);
    if (!last) return null;

    const prev = parseFloat(last[field]!.replace(",", "."));
    const current = parseFloat(currentEntry[field]!.replace(",", "."));
    if (isNaN(prev) || isNaN(current)) return null;

    const diff = current - prev;
    const date1 = parseDate(last.date);
    const date2 = parseDate(currentDate);
    const daysDiff = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return `nezměněna ${daysDiff} ${daysDiff === 1 ? "den" 
      : daysDiff >= 2 && daysDiff <= 4 ? "dny"
      : "dní"}`;

    return (
      <Text style={{ color: diff > 0 ? "green" : "red" }}>
        {diff > 0 ? "+" : ""}
        {(diff.toFixed(1)).replace(".", ",")} {unit} za {daysDiff}{" "}
        {daysDiff === 1 ? "den" 
        : daysDiff >= 2 && daysDiff <= 4 ? "dny"
        : "dní"}
      </Text>
    );
  }

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/weight-height-add" />
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Jak rostu</Title>
        <View>
          <FilterButton selected={filters} onChange={setFilters} />
        </View>
        <View>
          {sortedNotes.length > 0 ? (
            sortedNotes.map((wh) => {
              const originalIndex =
                selectedChild?.wh?.findIndex((item) => item.date === wh.date) ?? -1;
              
              const isVisible =
                (filters.includes("weight") && wh.weight) ||
                (filters.includes("height") && wh.height) ||
                (filters.includes("head") && wh.head) ||
                (filters.includes("clothes") && wh.clothes) ||
                (filters.includes("foot") && wh.foot);
              if (!isVisible) return null;

              return (
                <GroupSection key={wh.date} style={styles.whRow}>
                  {isEditMode && originalIndex !== -1 && (
                    <EditPencil
                      targetPath={`/actions/weight-height-edit?whIndex=${originalIndex}`}
                      color={COLORS.primary}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.item}> {wh.date} </Text>
                    {filters.includes("weight") && wh.weight ? (
                      <Text style={styles.note}>
                        ⚖️ {wh.weight} kg {renderDifference(sortedNotes, wh.date, "weight", "kg")}
                      </Text>
                    ) : null}
                    {filters.includes("height") && wh.height ? (
                      <Text style={styles.note}>
                        📏 {wh.height} cm {renderDifference(sortedNotes, wh.date, "height", "cm")}
                      </Text>
                    ) : null}
                    {filters.includes("head") && wh.head ? (
                      <Text style={styles.note}>
                        👶 {wh.head} cm {renderDifference(sortedNotes, wh.date, "head", "cm")}
                      </Text>
                    ) : null}
                    {filters.includes("clothes") && wh.clothes ? (
                      <Text style={styles.note}>👕 {wh.clothes}</Text>
                    ) : null}
                    {filters.includes("foot") && wh.foot ? (
                      <Text style={styles.note}>🦶 {wh.foot}</Text>
                    ) : null}
                  </View>
                </GroupSection>
              );
            })
          ) : (
            <Subtitle style={{ textAlign: "center" }}>
              Žádné záznamy zatím nebyly uloženy.
            </Subtitle>
          )}
        </View>
      </ScrollView>
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
  item: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  whRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  note: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 3,
  },
});