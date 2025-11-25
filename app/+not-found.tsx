import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { COLORS } from "@/constants/MyColors";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";

export default function NotFoundScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Jejda 🤯{"\n"}Stránka nebyla nalezena</ThemedText>
      <Link href="/home" style={styles.link}>
        <ThemedText type="link" style={styles.linkText}>
          Zpět na úvodní obrazovku
        </ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundContainer,
  },
  title: {
    fontSize: 30,
    textAlign: "center",
    color: COLORS.primary,
    marginBottom: 30,
    paddingTop: 10,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 23,
    textAlign: "center",
  },
});
