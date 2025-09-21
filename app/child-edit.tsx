import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import PhotoChooser from "@/components/PhotoChooser";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function ChildEdit() {
  const router = useRouter();
  
  const { selectedChildIndex, allChildren, saveAllChildren } = useChild();
  const childIdx = selectedChildIndex;
  const isValidIndex = childIdx !== null && childIdx >= 0 && childIdx < allChildren.length;

  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(
    isValidIndex ? new Date(allChildren[childIdx].birthDate) : null
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const anonymPicture = require("../assets/images/avatars/avatarN0.jpg");

  useEffect(() => {
    if (isValidIndex) {
      const kid = allChildren[childIdx];
      setName(kid.name);
      setSex(kid.sex);
      setPhotoUri(kid.photo);
    }
  }, [childIdx, isValidIndex, allChildren]);
  
  const handleSave = async () => {
    if (!name.trim() || !sex || !birthDate) {
      alert("Vyplň všechna pole.");
      return;
    }

    if (!birthDate || isNaN(birthDate.getTime())) {
      alert("Datum narození není platné.");
      return;
    }

    const updated = [...allChildren];
    if (childIdx === null || childIdx < 0 || childIdx >= updated.length) {
      alert("Neplatný index dítěte.");
      return;
    }

    const currentChild = updated[childIdx];
    const childId = currentChild.id;   // už existující ID

    let finalPhotoUri = currentChild.photo;

    if (photoUri && photoUri !== currentChild.photo) {
      // uživatel vybral novou fotku → uložíme ji pod stabilním jménem podle ID
      const newPath = FileSystem.documentDirectory + `${childId}.jpg`;

      try {
        // smaž starou, pokud existuje (aby nedocházelo k bordelu)
        await FileSystem.deleteAsync(newPath, { idempotent: true });

        // překopíruj novou do finální cesty
        await FileSystem.copyAsync({
          from: photoUri,
          to: newPath,
        });

        finalPhotoUri = newPath;
      } catch (err) {
        console.error("Chyba při ukládání nové fotky:", err);
        finalPhotoUri = photoUri; // fallback
      }
    }

    updated[childIdx] = {
      ...currentChild,
      name,
      sex,
      birthDate: birthDate.toISOString(),
      photo: finalPhotoUri,
    };

    await saveAllChildren(updated);
    alert("Údaje byly uloženy.");
    router.back();
  };
  
  return (
    <MainScreenContainer>
      <CustomHeader>
        {childIdx !== null && <DeleteButton type="child" index={childIdx} />}
      </CustomHeader>
      <Title>Uprav informace</Title>
      <Subtitle>Jméno</Subtitle>

      <MyTextInput
        placeholder="Jméno"
        value={name}
        onChangeText={setName}
      />

      <Subtitle style={{marginTop: 10}}>Datum narození</Subtitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
        <View style={{ width: "80%" }}>
          <ValidatedDateInput
            value={birthDate ? birthDate.toISOString().slice(0, 10) : ""}
            onChange={(val) => setBirthDate(val ? new Date(val) : null)} 
            birthISO={isValidIndex ? allChildren[childIdx].birthDate : null} 
            allowPastDates
            fallbackOnError="original"
          />
        </View>
        <DateSelector
          date={birthDate && !isNaN(birthDate.getTime()) ? birthDate : new Date()}
          onChange={(newDate) => setBirthDate(newDate)}
        />
      </View>

      <View style={styles.genderContainer}>
        <Pressable
          style={[
            styles.genderButton,
            sex === "chlapec" && styles.genderSelected,
          ]}
          onPress={() => setSex("chlapec")}
        >
          <Text style={[
            sex === "chlapec" && styles.genderTextSelected,
          ]}>Chlapec</Text>
        </Pressable>

        <Pressable
          style={[
            styles.genderButton,
            sex === "divka" && styles.genderSelected,
          ]}
          onPress={() => setSex("divka")}
        >
          <Text style={[
            sex === "divka" && styles.genderTextSelected,
          ]}>Dívka</Text>
        </Pressable>
      </View>

      <PhotoChooser onSelect={(uri) => setPhotoUri(uri)} />
        {photoUri && (
          <Image
            source={
              typeof photoUri === "string"
              ? { uri: photoUri }
              : anonymPicture
            }
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              alignSelf: "center",
              marginVertical: 10,
            }}
          />
        )}
      <CheckButton style={{marginBottom: 20}} onPress = {handleSave} />
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
    marginBottom: 40,
  },
  genderButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: 80,
    justifyContent: "center",
    alignItems: "center", 
  },
  genderSelected: {
    backgroundColor: COLORS.primary,
  },
  genderTextSelected: {
    color: "white",
  },
});