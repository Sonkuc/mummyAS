import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import PhotoChooser from "@/components/PhotoChooser";
import { saveChildren } from "@/components/storage/SaveChildren";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import uuid from "react-native-uuid";

export default function ChildAdd() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { saveAllChildren, allChildren, setSelectedChildIndex } = useChild();
  const anonymPicture = require("../assets/images/avatars/avatarN0.jpg");

  const handleSave = async () => {
    if (!name.trim() || !sex || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
      alert("Vyplň všechna pole.");
    return;
    }

    const newDate = birthDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const exists = allChildren.some(c => 
      c.name.toLowerCase() === name.toLowerCase() && 
      c.birthDate.slice(0, 10) === newDate
    );
    if (exists) {
      alert("Toto dítě už je přidáno.");
      return;
  }

  const newChild = {
    id: uuid.v4() as string,
    name,
    sex,
    birthDate: birthDate.toISOString(),
    photo: photoUri || Image.resolveAssetSource(anonymPicture).uri,
    milestones: [],
    words: [],
    teethDates: {},
    wh: [],
  };

   try {
    const saved = await saveChildren(newChild);
    
    if (!saved) {
      alert("Chyba při ukládání.");
      return;
    }

    const updatedChildren = [...allChildren, newChild];
    await saveAllChildren(updatedChildren);

    const newIndex = updatedChildren.findIndex((child) => child.id === newChild.id);
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
      <Subtitle>Jméno dítěte</Subtitle>

      <MyTextInput
        placeholder="Jméno"
        value={name}
        onChangeText={setName}
      />

      <Subtitle>Datum narození</Subtitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
        <View style={{ width: "80%" }}>
          <MyTextInput
            placeholder="YYYY-MM-DD"
            value={birthDate.toISOString().slice(0, 10)}
            onChangeText={(text) => {
              const parts = text.split("-");
              if (parts.length === 3) {
                const [year, month, day] = parts.map(Number);
                setBirthDate(new Date(year, month - 1, day));
              }
            }}
          />
        </View>
        <DateSelector
          date={new Date(birthDate)}
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
          <Text style={styles.genderText}>Chlapec</Text>
        </Pressable>

        <Pressable
          style={[
            styles.genderButton,
            sex === "divka" && styles.genderSelected,
          ]}
          onPress={() => setSex("divka")}
        >
          <Text style={styles.genderText}>Dívka</Text>
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
            marginVertical: 20,
          }}
        />
      )}
      <CheckButton onPress = {handleSave} /> 

    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 30,
  },
  genderButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgb(164, 91, 143)",
    width: 80,
    justifyContent: "center",
    alignItems: "center", 
  },
  genderSelected: {
    backgroundColor: "rgb(164, 91, 143)",
  },
  genderText: {
    color: "#333",
  },
});