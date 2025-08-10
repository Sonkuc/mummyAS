import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import PhotoChooser from "@/components/PhotoChooser";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
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
  const [birthDate, setBirthDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const anonymPicture = require("../assets/images/avatars/avatarN0.jpg");

  useEffect(() => {
    if (isValidIndex) {
      const kid = allChildren[childIdx];
      setName(kid.name);
      setSex(kid.sex);
      setBirthDate(new Date(kid.birthDate));
      setPhotoUri(kid.photo);
    }
  }, [childIdx, isValidIndex, allChildren]);
  
  const handleSave = async () => {
    if (!name.trim() || !sex || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
      alert("Vyplň všechna pole.");
      return;
    }

  const newDate = birthDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const existingIndex = allChildren.findIndex(c =>
    c.name.toLowerCase() === name.toLowerCase() &&
    c.birthDate.slice(0, 10) === newDate
  );

  const updated = [...allChildren];
  const photoToSave = photoUri || Image.resolveAssetSource(anonymPicture).uri;

  if (existingIndex !== -1) {
    // Existující dítě najdu
    // Pokud je to stejné dítě jako to, které upravujeme (indexy se shodují), tak updateju tam
    // Pokud ne, updateju dítě na existujícím indexu (duplikát) - tím "přepíšu" existující
    updated[existingIndex] = {
      ...updated[existingIndex],
      name: name,
      sex: sex,
      birthDate: birthDate.toISOString(),
      photo: photoToSave,
    };
  } else if (childIdx !== null && childIdx >= 0 && childIdx < updated.length) {
    // Jinak aktualizuju dítě podle vybraného indexu
    updated[childIdx] = {
      ...updated[childIdx],
      name: name,
      sex: sex,
      birthDate: birthDate.toISOString(),
      photo: photoToSave,
    };
  } else {
    alert("Neplatný index dítěte.");
    return;
  }

    await saveAllChildren(updated);
    alert("Údaje byly uloženy.");
    router.back();
  };
  
  return (
    <MainScreenContainer>
      <CustomHeader>
        {childIdx !== null && <DeleteButton type="child" index={childIdx} />}
      </CustomHeader>
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
                const newDate = new Date(year, month - 1, day);
                if (!isNaN(newDate.getTime())) {
                  setBirthDate(newDate); 
                }
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