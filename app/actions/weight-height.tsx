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

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/weight-height-add" />
      </CustomHeader>
      <Title style={{marginTop: 40}}>Jak rostu</Title>
      <View>
         {sortedNotes.length > 0 ? (
          sortedNotes.map((wh, whIndex) => (
            <View key={whIndex} style={styles.whRow}>
              {isEditMode && (
                <EditPencil 
                  targetPath={`/actions/weight-height-edit?whIndex=${whIndex}`} 
                  color="#bf5f82" 
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.item}>
                  {wh.date} {wh.weight} {wh.height}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Subtitle style={{ textAlign: "center" }}>
            Žádné záznamy zatím nebyly uloženy.
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
    whRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});