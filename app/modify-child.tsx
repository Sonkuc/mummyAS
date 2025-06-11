import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import MyTextInput from "@/components/MyTextInput";
import PhotoChooser from "@/components/PhotoChooser";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function ModifyChild() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const { index } = useLocalSearchParams();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { allChildren, saveAllChildren } = useChild();

  useEffect(() => {
      const idx = parseInt(index as string, 10);
      const kid = allChildren[idx];
      if (kid) {
        setName(kid.name);
        setSex(kid.sex);
        setBirthDate(new Date(kid.birthDate));
        setPhotoUri(kid.photo);
      }
    }, [index]);
  
  const handleSave = async () => {
  if (!name || !sex || !birthDate) {
    alert("Vyplň všechna pole.");
    return;
  }

  const updated = [...allChildren];
    updated[parseInt(index as string, 10)] = {
      name: name,
      sex: sex,
      birthDate: birthDate.toISOString(),
      photo: photoUri || "",}

    await saveAllChildren(updated);
    alert("Údaje byly uloženy.");
    router.replace("/");
  };

  const handleDelete = async () => {
    Alert.alert(
    "Smazat dítě",
    "Opravdu chceš tento záznam smazat?",
    [
      { text: "Zrušit", style: "cancel" },
      {
        text: "Smazat",
        style: "destructive",
        onPress: async () => {
          const idx = parseInt(index as string, 10);
          const updated = allChildren.filter((_, i) => i !== idx);
          await saveAllChildren(updated);
          alert("Záznam byl smazán.");
          router.replace("/");
        },
      },
    ],
    { cancelable: true }
  );
};

  return (
    <MainScreenContainer>
      <CustomHeader>
          <Pressable onPress={handleDelete} 
            style={{ alignSelf: "flex-end", justifyContent: "center", marginBottom: -70 }}>
            <Text style={{ fontSize: 30 }}>🚮</Text>
          </Pressable>
      </CustomHeader>
      <Title>Zadej informace</Title>
      <Subtitle>Jméno dítěte</Subtitle>

      <MyTextInput
        placeholder="Jméno"
        value={name}
        onChangeText={setName}
      />

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

      <MyButton title="Vyber datum narození" onPress={() => setShow(true)} />
      <Text style={{ 
        textAlign: "center", 
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 20, 
        marginTop: -30 }}>
        {birthDate.toLocaleDateString()}
      </Text>

      {show && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="spinner"
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate) {
              setBirthDate(selectedDate);
            }
          }}
        />
      )}

      <PhotoChooser onSelect={(uri) => setPhotoUri(uri)} />
      
            {photoUri && (
              <Image
                source={
                  typeof photoUri === "string"
                    ? { uri: photoUri }
                    : photoUri // když je to asset (require)
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
  },
  genderSelected: {
    backgroundColor: "rgb(164, 91, 143)",
  },
  genderText: {
    color: "#333",
  },
});