import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import FilterButton from "@/components/FilterButton";
import GroupSection from "@/components/GroupSection";
import { formatDateToCzech } from "@/components/IsoFormatDate";
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

  const toSafeDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    // Pokud je to ISO (2025-01-01)
    if (dateStr.includes("-")) return new Date(dateStr);
    // Pokud je to CZ (01.01.2025)
    const [day, month, year] = dateStr.split(".").map(Number);
    return new Date(year, month - 1, day);
  };
  
  const sortedNotes = React.useMemo(() => {
      return (selectedChild?.wh || [])
        .slice()
        .sort((a: any, b: any) => toSafeDate(b.date).getTime() - toSafeDate(a.date).getTime());
  }, [selectedChild]);

  useEffect(() => {
    if (!selectedChild?.id) return;
    const FILTERS_KEY = `filters-${selectedChild.id}`;
    AsyncStorage.getItem(FILTERS_KEY).then(stored => {
      if (stored) setFilters(JSON.parse(stored));
    });
  }, [selectedChild?.id]);

  useEffect(() => {
    if (!selectedChild?.id) return;
    const FILTERS_KEY = `filters-${selectedChild.id}`;
    AsyncStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  }, [filters, selectedChild?.id]);

  function getLastValue(arr: any[], currentDate: string, field: string) {
    const currentTime = toSafeDate(currentDate).getTime();
    return arr
      .filter(item => 
        toSafeDate(item.date).getTime() < currentTime && 
        item[field] && item[field].toString().trim() !== ""
      )
      .sort((a, b) => toSafeDate(b.date).getTime() - toSafeDate(a.date).getTime())[0];
  }

  function renderDifference(arr: any[], currentDate: string, field: string, unit: string) {
    const currentEntry = arr.find(item => item.date === currentDate);
    if (!currentEntry?.[field]) return null;

    const last = getLastValue(arr, currentDate, field);
    if (!last) return null;

    const prev = parseFloat(last[field].toString().replace(",", "."));
    const current = parseFloat(currentEntry[field].toString().replace(",", "."));
    if (isNaN(prev) || isNaN(current)) return null;

    const diff = current - prev;
    const daysDiff = Math.round((toSafeDate(currentDate).getTime() - toSafeDate(last.date).getTime()) / (1000 * 60 * 60 * 24));

    return {
      label: diff === 0 ? "(beze změny)" : `${diff > 0 ? "+" : ""}${diff.toFixed(1).replace(".", ",")} ${unit} (za ${daysDiff} d.)`,
      color: diff === 0 ? "gray" : diff > 0 ? "green" : "red"
    };
  }

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/weight-height-add" />
      </CustomHeader>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Jak rostu</Title>
        <FilterButton selected={filters} onChange={setFilters} />

        <View style={{ marginTop: 20 }}>
          {sortedNotes.length > 0 ? (
            sortedNotes.map((wh: any) => {
              const whId = wh.id || wh.date;

              const isVisible = filters.some(f => wh[f] && wh[f].toString().trim() !== "");
              if (!isVisible) return null;

              return (
                <GroupSection key={whId} style={styles.whRow}>
                  {isEditMode && (
                    <EditPencil
                      targetPath={`/actions/weight-height-edit?whId=${whId}`}
                      color={COLORS.primary}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.item}>{formatDateToCzech(wh.date)}</Text>
                    {filters.includes("weight") && wh.weight ? (() => {
                      const diff = renderDifference(sortedNotes, wh.date, "weight", "kg");
                      return (
                        <Text style={styles.note}>
                          <Text>⚖️ {wh.weight} kg </Text>
                          {diff && <Text style={{ color: diff.color, fontSize: 12 }}>{diff.label}</Text>}
                        </Text>
                      );
                    })() : null}
                    {filters.includes("height") && wh.height ? (() => {
                      const diff = renderDifference(sortedNotes, wh.date, "height", "cm");
                      return (
                        <Text style={styles.note}>
                          <Text>📏 {wh.height} cm </Text>
                          {diff && <Text style={{ color: diff.color, fontSize: 12 }}>{diff.label}</Text>}
                        </Text>
                      );
                    })() : null}
                    {filters.includes("head") && wh.head ? (() => {
                      const diff = renderDifference(sortedNotes, wh.date, "head", "cm");
                      return (
                        <Text style={styles.note}>
                          <Text>👶 {wh.head} cm </Text>
                          {diff && <Text style={{ color: diff.color, fontSize: 12 }}>{diff.label}</Text>}
                        </Text>
                      );
                    })() : null}
                    {filters.includes("clothes") && wh.clothes && (
                      <Text style={styles.note}>👕 {wh.clothes}</Text>
                    )}
                    {filters.includes("foot") && wh.foot && (
                      <Text style={styles.note}>🦶 {wh.foot}</Text>
                    )}
                  </View>
                </GroupSection>
              );
            })
          ) : (
            <Subtitle style={{ textAlign: "center" }}>Žádné záznamy</Subtitle>
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