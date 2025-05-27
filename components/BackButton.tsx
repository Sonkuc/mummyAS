import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

export default function BackButton() {
  const router = useRouter();

  return (
    <Pressable style={styles.backButton} onPress={() => router.replace("/")}>
      <Ionicons name="arrow-back" size={28} color="#993769"/>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
});