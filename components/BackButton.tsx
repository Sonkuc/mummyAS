import { COLORS } from "@/constants/MyColors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

type BackButtonProps = {
  targetPath?: string;
  onPress?: () => void;
};

export default function BackButton({ targetPath, onPress }: BackButtonProps) {
  const router = useRouter();

  const handlePress = async () => {
    if (onPress) {
      await onPress();
      if (typeof targetPath === "string") {
        router.push(targetPath);
      } else {
        router.back();
      }
    } else {
      if (typeof targetPath === "string") {
        router.push(targetPath);
      } else {
        router.back();
      }
    }
  };

  return (
    <Pressable style={styles.backButton} onPress={handlePress}>
      <Ionicons name="arrow-back" size={28} color={COLORS.primary}/>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 35,
    zIndex: 100,
    padding: 10,
  },
});