import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import PhotoChooser from "@/components/PhotoChooser";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import uuid from "react-native-uuid";

export async function pickImage(onSelect: (uri: string) => void) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: [ImagePicker.MediaType.Image],
    quality: 1,
  });

  if (!result.canceled) {
    const sourceUri = result.assets[0].uri;

    // dočasné jméno souboru
    const tempName = `temp-${uuid.v4()}.jpg`;
    const tempPath = FileSystem.documentDirectory + tempName;

    try {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: tempPath,
      });
      onSelect(tempPath); // zatím dočasná cesta
    } catch (err) {
      console.error("Chyba při ukládání fotky:", err);
      onSelect(sourceUri); // fallback
    }
  }
}

export default function ChildAdd() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [birthDate, setBirthDate] = useState(today); 
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { saveAllChildren, allChildren, setSelectedChildIndex } = useChild();
  const anonymPicture = require("../assets/images/avatars/avatarN0.jpg");

  const handleSave = async () => {
    if (!name.trim() || !sex || !birthDate) {
      alert("Vyplň všechna pole.");
      return;
    }

    const [y, m, d] = birthDate.split("-").map(Number);
    const birthDateObj = new Date(y, m - 1, d);
    if (isNaN(birthDateObj.getTime())) {
      alert("Datum narození není platné.");
      return;
    }

    const exists = allChildren.some(c => 
      c.name.toLowerCase() === name.toLowerCase() && 
      c.birthDate.slice(0, 10) === birthDate
    );
    if (exists) {
      alert("Toto dítě už je přidáno.");
      return;
    }
    const childId = uuid.v4() as string;

    let finalPhotoUri: string;
    if (photoUri) {
      // přejmenujeme dočasný soubor na stabilní název podle ID dítěte
      const newPath = FileSystem.documentDirectory + `${childId}.jpg`;
      try {
        await FileSystem.moveAsync({
          from: photoUri,
          to: newPath,
        });
        finalPhotoUri = newPath;
      } catch (err) {
        console.error("Chyba při přejmenování fotky:", err);
        finalPhotoUri = photoUri; // fallback
      }
    } else {
      finalPhotoUri = Image.resolveAssetSource(anonymPicture).uri;
    }

    const newChild = {
      id: childId,
      name,
      sex,
      birthDate: birthDateObj.toISOString(),
      photo: finalPhotoUri || Image.resolveAssetSource(anonymPicture).uri,
      milestones: [],
      words: [],
      teethDates: {},
      wh: [],
    };

    try {
      const updatedChildren = [...allChildren, newChild];
      await saveAllChildren(updatedChildren);

      const newIndex = updatedChildren.findIndex(
        (child) => child.id === newChild.id
      );
      if (newIndex !== -1) {
        await setSelectedChildIndex(newIndex);
      }

      router.replace("/");
    } catch (error) {
      alert("Nastala neočekávaná chyba při ukládání.");
    }
  };

  return (
    <MainScreenContainer>
      <CustomHeader/> 
      <Title>Zadej informace</Title>
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
            value={birthDate}
            onChange={setBirthDate} 
            allowPastDates
          />
        </View>
        <DateSelector
          date={new Date(birthDate)}
          onChange={(newDate) => setBirthDate(newDate.toISOString().slice(0, 10))}
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