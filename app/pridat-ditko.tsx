import CheckButton from '@/components/CheckButton';
import { saveChildren } from '@/components/storage/saveChildren';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import BackButton from "../components/BackButton";
import MyButton from "../components/MyButton";
import MyTextInput from "../components/MyTextInput";
import PhotoChooser from "../components/PhotoChooser";
import Subtitle from "../components/Subtitle";
import Title from "../components/Title";

export default function PridatDitko() {
  const router = useRouter();
  const navigation = useNavigation();
  const [jmeno, setJmeno] = useState("");
  const [pohlavi, setPohlavi] = useState("");
  const [datumNarozeni, setDatumNarozeni] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);


    useLayoutEffect(() => {
      navigation.setOptions({
        title: "Přidej dítě",
        headerShown: false,
      });
    }, [navigation]);
  
  
  
  const handleSave = async () => {
  if (!jmeno || !pohlavi || !datumNarozeni) {
    alert("Vyplň všechna pole.");
    return;
  }

  const newChild = {
    jmeno,
    pohlavi,
    datumNarozeni: datumNarozeni.toISOString(),
    foto: photoUri || "",
  };

  const saved = await saveChildren(newChild);

  if (saved) {

    console.log(
    "Obsah AsyncStorage:",
    await AsyncStorage.getItem("kids")
  );
    router.replace("/");
  } else {
    alert("Chyba při ukládání.");
  }
};

  return (
    <View style={styles.container}>
      <BackButton />
      <Title>Zadej informace</Title>
      <Subtitle>Jméno dítěte</Subtitle>

      <MyTextInput
        placeholder="Jméno"
        value={jmeno}
        onChangeText={setJmeno}
      />

      <View style={styles.genderContainer}>
        <Pressable
          style={[
            styles.genderButton,
            pohlavi === "chlapec" && styles.genderSelected,
          ]}
          onPress={() => setPohlavi("chlapec")}
        >
          <Text style={styles.genderText}>Chlapec</Text>
        </Pressable>

        <Pressable
          style={[
            styles.genderButton,
            pohlavi === "divka" && styles.genderSelected,
          ]}
          onPress={() => setPohlavi("divka")}
        >
          <Text style={styles.genderText}>Dívka</Text>
        </Pressable>
      </View>

      <MyButton
        title="Vyber datum narození"
        onPress={() => setShowDatePicker(true)}
      />

      {showDatePicker && (
        <DateTimePicker
          value={datumNarozeni}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setDatumNarozeni(date);
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff0f5",
    padding: 20,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
    marginBottom: 50,
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