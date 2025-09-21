import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { COLORS } from "@/constants/MyColors";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Jejda 🤯</ThemedText>
        <ThemedText style={styles.title}>Stránka nebyla nalezena</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link" style={{fontSize: 23}}>Zpět na úvodní obrazovku</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    marginTop: 15,
    paddingVertical: 15,
    fontSize: 20,
    textAlign: "center",
  },
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
});
