import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import { formatDateToCzech } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import SortButton from "@/components/SortButton";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Speaking() {
  const { selectedChild } = useChild();
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [sortOn, setSortOn] = useState<"abc" | "dated">("abc");

  const toggleSortOn = () => {
    setSortOn((prev) => (prev === "abc" ? "dated" : "abc"));
  };

  const sortedWords = selectedChild?.words
    ? [...selectedChild.words].sort((a, b) => {
        if (sortOn === "abc") {
          return a.name.localeCompare(b.name, "cs", { sensitivity: "base" });
        } else {
          // Najdeme nejstarší datum pro každé slovo (vždy první v seřazených entries)
          const dateA = (a.entries || []).sort((x, y) => x.date.localeCompare(y.date))[0]?.date || "";
          const dateB = (b.entries || []).sort((x, y) => x.date.localeCompare(y.date))[0]?.date || "";
          return dateA.localeCompare(dateB);
        }
      })
    : [];

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/speaking-add" />
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Už povídám</Title>
        {sortedWords.length > 0 ? (
          sortedWords.map((word) => (
            <GroupSection key={word.id}>
              <View style={styles.row}>
                {isEditMode && (
                  <EditPencil 
                    targetPath={`/actions/speaking-edit?wordId=${word.id}`} 
                    color={COLORS.primary}
                  />
                )}
                <Text style={styles.item}>{word.name}</Text>
              </View>
                {(word.entries || []) // Přidána pojistka "|| []"
                  .slice() // Vytvoří kopii pole (dobrá praxe před sortem)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((entry, i) => (
                    <Text key={entry.id || i} style={styles.note}>
                      {formatDateToCzech(entry.date)}
                      {entry.note ? `: ${entry.note}` : ""}
                    </Text>
                    ))
                }
            </GroupSection>
          ))
        ) : (
          <Subtitle style={{ textAlign: "center" }}>
            Žádná slova zatím nebyla uložena.
          </Subtitle>
        )}
      </ScrollView>
      <EditPencil 
        onPress={() => setIsEditMode(!isEditMode)}
        color="white"
        circle
        editMode={isEditMode}
      />
      <SortButton 
        sortOn={sortOn}
        onPress={toggleSortOn}
      />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  item: {
    fontSize: 16,
    fontWeight: "bold",
  },
  note: {
    fontSize: 16,
    marginLeft: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});