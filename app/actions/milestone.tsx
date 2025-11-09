import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Milestone() {
  const { selectedChild } = useChild();
  const [isEditMode, setIsEditMode] = React.useState(false);

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split(".");
    return new Date(`${year}-${month}-${day}`) || new Date(0);
  };

  const sortedMilestones = [...(selectedChild?.milestones || [])].sort(
  (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
  );

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/milestone-add" />
      </CustomHeader>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Už umím</Title>
        <View>
          {sortedMilestones.length > 0 ? (
            sortedMilestones.map((m, milId) => (
              <GroupSection key={milId}>
                <View style={{ flexDirection: "row", alignItems: "center"}}>
                  {isEditMode && (
                    <EditPencil 
                      targetPath={`/actions/milestone-edit?milId=${m.milId}`}
                      color={COLORS.primary}
                    />
                  )}
                  <Text style={styles.item}>
                    {m.date}
                  </Text>
                  <Text style={{fontSize: 16, marginLeft: 10}}>
                    {m.name}
                  </Text>
                </View> 
                {m.note?.trim() !== "" && (
                  <Text style={styles.note}>  {m.note}</Text>
                )}
            </GroupSection> 
            ))
          ) : (
            <Subtitle style={{ textAlign: "center" }}>
              Žádné milníky zatím nebyly uloženy.
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
    color: "#555",
    marginTop: 5,
  },
});