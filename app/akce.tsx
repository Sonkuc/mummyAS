import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";

export default function Akce() {
  const router = useRouter();
  const navigation = useNavigation();
  
    useLayoutEffect(() => {
      navigation.setOptions({
        title: "Akce",
        headerShown: false,
      });
    }, [navigation]);
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zadej informace</Text>
      <Text style={styles.subtitle}>Jméno dítěte</Text>

      
      <Pressable style={styles.photoButton}>
        <Text style={styles.buttonText}>Vyber fotku nebo avatar</Text>
      </Pressable>

      <Button title="Uložit" onPress={() => console.log({ jmeno, pohlavi, datumNarozeni })} />
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
  
  photoButton: {
    backgroundColor: "#9370db",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});