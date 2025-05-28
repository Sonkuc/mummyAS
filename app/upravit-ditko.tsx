import CheckButton from '@/components/CheckButton';
import { loadChildren } from "@/components/storage/loadChildren";
import { Child } from "@/components/storage/saveChildren";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BackButton from "../components/BackButton";
import MyButton from "../components/MyButton";
import MyTextInput from "../components/MyTextInput";
import PhotoChooser from "../components/PhotoChooser";
import Subtitle from "../components/Subtitle";
import Title from "../components/Title";

export default function UpravDitko() {
  const router = useRouter();
  const [jmeno, setJmeno] = useState("");
  const [pohlavi, setPohlavi] = useState("");
  const [datumNarozeni, setDatumNarozeni] = useState(new Date());
  const [show, setShow] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const { index } = useLocalSearchParams();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (typeof index !== "string" || isNaN(parseInt(index))) {
      alert("Chyba: neplatný index.");
      router.replace("/");
      return;
      }

      const loaded = await loadChildren();
      setChildren(loaded);

      const idx = parseInt(index as string, 10);
      const kid = loaded[idx];
      if (kid) {
        setJmeno(kid.jmeno);
        setPohlavi(kid.pohlavi);
        setDatumNarozeni(new Date(kid.datumNarozeni));
        setPhotoUri(kid.foto);
      }
    };

    loadData();
  }, [index]);  
  
  
  const handleSave = async () => {
  if (!jmeno || !pohlavi || !datumNarozeni) {
    alert("Vyplň všechna pole.");
    return;
  }

  const updated = [...children];
    updated[parseInt(index as string, 10)] = {
      jmeno,
      pohlavi,
      datumNarozeni: datumNarozeni.toISOString(),
      foto: photoUri || "",}
    await AsyncStorage.setItem("kids", JSON.stringify(updated));

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
          const updated = children.filter((_, i) => i !== idx);

          await AsyncStorage.setItem("kids", JSON.stringify(updated));

          alert("Záznam byl smazán.");
          router.replace("/");
        },
      },
    ],
    { cancelable: true }
  );
};

  return (
    <ScrollView style={styles.container}>
      <BackButton />
      <Pressable onPress={handleDelete}
        style={{ alignSelf: "flex-end", marginTop: 35, marginBottom: -70 }}>
        <Text style={{ fontSize: 30 }}>🚮</Text>
      </Pressable>

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
        marginBottom: 20, 
        marginTop: -30 }}>
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