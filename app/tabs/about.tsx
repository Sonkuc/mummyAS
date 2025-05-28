import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function About() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Já ti to povím.</Text>
      <Link href="/" style={styles.link}>
          Domů

        </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(240, 174, 230, 0.78)',
  },
  text: {
    color: "white",
    fontSize: 20,
  },
  link: {
    color: "#61dafb",
    fontSize: 18,
    textDecorationLine: "underline",
  },
});
