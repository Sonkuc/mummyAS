import AddButton from "@/components/AddButton";
import CustomHeader from "@/components/CustomHeader";
import EditPencil from "@/components/EditPencil";
import GroupSection from "@/components/GroupSection";
import MainScreenContainer from "@/components/MainScreenContainer";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { formatDateToCzech } from "@/components/IsoFormatDate";

export default function Diary() {
  const { selectedChild } = useChild();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [noteText, setNoteText] = useState("");

  const records = selectedChild?.diaryRecords || [];

  const handleEdit = (record: any) => {
    setEditingRecordId(record.id);
    setName(record.name);
    setNoteText(record.text || "");
    setModalVisible(true);
  };

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions">
        <AddButton targetPath="/actions/diary-add" />
      </CustomHeader>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Title>Deník</Title>
        {records.length > 0 ? (
          [...records].sort((a,b) => b.date.localeCompare(a.date)).map((diary) => (
            <GroupSection key={diary.id}>
              <View style={styles.row}>
                <View style={styles.leftContent}>
                  {isEditMode && (
                    <Pressable 
                      onPress={() => handleEdit(diary)} 
                      style={styles.pencilWrapper}
                    >
                      <EditPencil targetPath={`/actions/diary-edit?diaryId=${diary.id}`} color={COLORS.primary}  />
                    </Pressable>
                  )} 
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {diary.name}
                  </Text>
                </View>

                <Text style={styles.dateText}>
                  {formatDateToCzech(diary.date)}
                </Text>
              </View>

              {diary.text ? (
                <Text style={styles.itemNote}>{diary.text}</Text>
              ) : null}
            </GroupSection>
          ))
        ) : (
          <Subtitle style={{ textAlign: "center", marginTop: 40 }}>
            Žádné záznamy zatím nebyly uloženy.
          </Subtitle>
        )}
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
  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    width: '100%',
    marginBottom: 4
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, 
    marginRight: 10
  },
  pencilWrapper: {
    marginRight: 8, 
  },
  itemTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: COLORS.primary,
    flexShrink: 1 
  },
  dateText: { 
    fontSize: 12, 
    color: "gray",
    fontWeight: '500'
  },
  itemNote: { 
    fontSize: 14, 
    color: "#555", 
    marginTop: 6,
    lineHeight: 20
  },
});