import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Speaking() {
  const { selectedChild } = useChild();
  const router = useRouter();
  const [isEditMode, setIsEditMode] = React.useState(false);

  const formatDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year}`;
  };

  const sortedWords = [...(selectedChild?.words || [])]
  .map((word) => ({
    word,
    originalIndex: selectedChild?.words?.findIndex(w => w.name === word.name),
  }))
  .sort((a, b) =>
    a.word.name.localeCompare(b.word.name, "cs", { sensitivity: "base" })
  );

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/speaking-add" />
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Už povídám</Title>
        <View>
          {sortedWords.length > 0 ? (
            sortedWords.map(({ word, originalIndex }) => (
              <GroupSection key={originalIndex}>
                <View style={styles.row}>
                  {isEditMode && (
                    <EditPencil 
                      targetPath={`/actions/speaking-edit?wordIndex=${originalIndex}`} 
                      color="#993769" 
                    />
                  )}
                  <Text style={styles.item}>{word.name}</Text>
                </View>
                  {word.entries
                    ?.slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((entry, i) => (
                    <Text key={i} style={styles.note}>
                      {formatDate(entry.date)}
                      {entry.note?.trim() ? `: ${entry.note}` : ""}
                    </Text>
                    ))}
              </GroupSection>
            ))
          ) : (
            <Subtitle style={{ textAlign: "center" }}>
              Žádná slova zatím nebyla uložena.
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