import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function PridatDitko() {
  const router = useRouter();
  const navigation = useNavigation();
  
    useLayoutEffect(() => {
      navigation.setOptions({
        title: "Přidej dítě",
        headerShown: false,
      });
    }, [navigation]);
  
  const [jmeno, setJmeno] = useState("");
  const [pohlavi, setPohlavi] = useState("");
  const [datumNarozeni, setDatumNarozeni] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zadej informace</Text>
      <Text style={styles.subtitle}>Jméno dítěte</Text>

      <TextInput
        style={styles.input}
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

      <Pressable
        style={styles.longButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.buttonText}>Vyber datum narození</Text>
      </Pressable>

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

      <Pressable style={styles.longButton}>
        <Text style={styles.buttonText}>Vyber fotku nebo avatar</Text>
      </Pressable>

      <Pressable onPress={() => console.log({ jmeno, pohlavi, datumNarozeni })} style={styles.checkButton}>
        <FontAwesome name="check" size={40} color="#rgb(7, 208, 48)" />
      </Pressable>
      
      <Pressable onPress={() => router.push("/")} style={styles.homeButton}>
        <FontAwesome name="home" size={40} color="rgb(164, 91, 143)" />
      </Pressable>
    
    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff0f5",
    padding: 20,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 70,
    color: "#993769",
  },
  subtitle: {
    fontSize: 20,
    color: "#bf5f82",
    marginBottom: 5,
    marginTop: 20,
  },
  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: "#ccc",
    borderWidth: 1,
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
  longButton: {
    backgroundColor: "rgb(164, 91, 143)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  homeButton: {
    padding: 80,
    marginTop: 170,
    alignItems: "center",
  },
  checkButton: {
    marginTop: 5,
    padding: 3,
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    elevation: 3,
    backgroundColor: "rgba(164, 91, 143, 0.45)",
  }
});