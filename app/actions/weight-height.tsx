import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function WeightHeight() {
  const { selectedChild } = useChild();
  const router = useRouter();
  const [isEditMode, setIsEditMode] = React.useState(false);

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split(".");
    return new Date(`${year}-${month}-${day}`);
  };

  const sortedNotes = [...(selectedChild?.wh || [])].sort(
    (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
  );

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
      <Title style={{ marginTop: 40 }}>Jak rostu</Title>
      <View>
        {sortedNotes.map((wh) => {
          const originalIndex =
            selectedChild?.wh?.findIndex((item) => item.date === wh.date) ?? -1;

          return (
            <View key={wh.date} style={styles.whRow}>
              {isEditMode && originalIndex !== -1 && (
                <EditPencil
                  targetPath={`/actions/weight-height-edit?whIndex=${originalIndex}`}
                  color="#bf5f82"
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.item}> {wh.date} </Text>
                {wh.weight ? (
                  <Text style={styles.note}>
                    ⚖️ {wh.weight} kg {renderDifference(sortedNotes, wh.date, "weight", "kg")}
                  </Text>
                ) : null}
                {wh.height ? (
                  <Text style={styles.note}>
                    📏 {wh.height} cm {renderDifference(sortedNotes, wh.date, "height", "cm")}
                  </Text>
                ) : null}
                {wh.head ? (
                  <Text style={styles.note}>
                    👶 {wh.head} cm {renderDifference(sortedNotes, wh.date, "head", "cm")}
                  </Text>
                ) : null}
                {wh.clothes ? (
                  <Text style={styles.note}>👕 {wh.clothes}</Text>
                ) : null}
                {wh.foot ? (
                  <Text style={styles.note}>🦶 {wh.foot}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
          <Subtitle style={{ textAlign: "center" }}>
            Žádné záznamy zatím nebyly uloženy.
          </Subtitle>
      </View>
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
  subtitle: {
    fontSize: 20,
    color: "#bf5f82",
    marginBottom: 5,
  },
  item: {
    fontSize: 20,
    color: "#993769",
  },
    whRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  note: {
    fontSize: 18,
    color: "#993769",
    marginLeft: 20,
  },
});