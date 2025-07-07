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

export default function Milestone() {
  const { selectedChild } = useChild();
  const router = useRouter();
  const [isEditMode, setIsEditMode] = React.useState(false);

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split(".");
    return new Date(`${year}-${month}-${day}`);
  };

  const sortedMilestones = [...(selectedChild?.milestones || [])].sort(
  (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
  );

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/milestone-add" />
      </CustomHeader>
      <Title style={{marginTop: 40}}>Milníky</Title>
      <View>
         {sortedMilestones.length > 0 ? (
          sortedMilestones.map((m, milIndex) => (
            <View key={milIndex} style={styles.milestoneRow}>
              {isEditMode && (
                <EditPencil 
                  targetPath={`/actions/milestone-edit?milIndex=${milIndex}`} 
                  color="#bf5f82" 
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.item}>
                  {m.date} {m.name}
                </Text>
                {m.note?.trim() !== "" && (
                <Text style={styles.note}>  {m.note}</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <Subtitle style={{ textAlign: "center" }}>
            Žádné milníky zatím nebyly uloženy.
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
    milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});