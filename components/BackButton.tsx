import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

type BackButtonProps = {
  targetPath?: string;
};

export default function BackButton({ targetPath }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (typeof targetPath === "string") {
    router.push(targetPath);
  } else {
    router.back();
  }
};

  return (
    <Pressable style={styles.backButton} onPress={handlePress}>
      <Ionicons name="arrow-back" size={28} color="#993769"/>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 35,
    zIndex: 10,
    padding: 10,
  },
});