import CheckButton from '@/components/CheckButton';
import { loadChildren } from "@/components/storage/loadChildren";
import { Child } from "@/components/storage/saveChildren";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import HomeIcon from "../components/HomeIcon";
import MyButton from "../components/MyButton";
import MyTextInput from "../components/MyTextInput";
import Subtitle from "../components/Subtitle";
import Title from "../components/Title";

export default function PridatDitko() {
  const router = useRouter();
  const navigation = useNavigation();
  const [jmeno, setJmeno] = useState("");
  const [pohlavi, setPohlavi] = useState("");
  const [datumNarozeni, setDatumNarozeni] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const { index } = useLocalSearchParams();

  
    useLayoutEffect(() => {
     navigation.setOptions({
        title: "Uprav dítě",
        headerShown: false,
      });
    }, [navigation]);

  useEffect(() => {
    const loadData = async () => {
      const loaded = await loadChildren();
      setChildren(loaded);

      const idx = parseInt(index as string, 10);
      const kid = loaded[idx];
      if (kid) {
        setJmeno(kid.jmeno);
        setPohlavi(kid.pohlavi);
        setDatumNarozeni(new Date(kid.datumNarozeni));
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
    <View style={styles.container}>
      <Pressable onPress={handleDelete}
        style={{ alignSelf: "flex-end", marginTop: 50, marginBottom: -70 }}>
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

      <MyButton title="Vyber fotku nebo avatar" onPress={() => {}} />
      <CheckButton onPress = {handleSave} />
      <HomeIcon />

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