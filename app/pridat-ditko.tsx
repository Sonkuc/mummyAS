import CheckButton from '@/components/CheckButton';
import { saveChildren } from '@/components/storage/saveChildren';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BackButton from "../components/BackButton";
import MyButton from "../components/MyButton";
import MyTextInput from "../components/MyTextInput";
import PhotoChooser from "../components/PhotoChooser";
import Subtitle from "../components/Subtitle";
import Title from "../components/Title";

export default function PridatDitko() {
  const router = useRouter();
  const [jmeno, setJmeno] = useState("");
  const [pohlavi, setPohlavi] = useState("");
  const [datumNarozeni, setDatumNarozeni] = useState(new Date());
  const [show, setShow] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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
    router.replace("/");
  } else {
    alert("Chyba při ukládání.");
  }
};

  return (
    <ScrollView style={styles.container}>
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

      <MyButton title="Vyber datum narození" onPress={() => setShow(true)} />
      <Text style={{ 
        textAlign: "center", 
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 50, 
        marginTop: -20 }}>
        {datumNarozeni.toLocaleDateString()}
      </Text>

      {show && (
        <DateTimePicker
          value={datumNarozeni}
          mode="date"
          display="spinner"
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate) {
              setDatumNarozeni(selectedDate);
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

    </ScrollView>
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