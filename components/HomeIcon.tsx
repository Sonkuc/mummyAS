import { COLORS } from "@/constants/MyColors";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { GestureResponderEvent, Pressable, StyleSheet } from "react-native";

type Props = {
  onPress: (event: GestureResponderEvent) => void;
};

export default function HomeIcon(){ 
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push("/")} style={styles.homeButton}>
      <FontAwesome name="home" size={40} color={COLORS.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  homeButton: {
    padding: 80,
    marginTop: 100,
    alignItems: "center",
  },
});