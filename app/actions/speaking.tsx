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
      <Title style={{marginTop: 40}}>Mluvení</Title>
      <View>
         {sortedWords.length > 0 ? (
          sortedWords.map(({ word, originalIndex }) => (
            <View key={originalIndex} style={styles.wordRow}>
              {isEditMode && (
                <EditPencil 
                  targetPath={`/actions/speaking-edit?wordIndex=${originalIndex}`} 
                  color="#bf5f82" 
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.item}>{word.name}</Text>
                {word.entries?.map((entry, i) => (
                  <Text key={i} style={styles.note}>
                    {formatDate(entry.date)}
                    {entry.note?.trim() ? `: ${entry.note}` : ""}
                  </Text>
                ))}
              </View>
            </View>
          ))
        ) : (
          <Subtitle style={{ textAlign: "center" }}>
            Žádná slova zatím nebyla uložena.
          </Subtitle>
        )}
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
  note: {
    fontSize: 16,
    color: "#993769",
    marginLeft: 10,
  },
    wordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});