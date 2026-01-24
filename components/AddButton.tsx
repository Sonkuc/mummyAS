import { COLORS } from "@/constants/MyColors";
import { useRouter, type Href } from "expo-router";
import { Plus } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  targetPath?: string;
  style?: object;
  onPress?: () => void;
};  

export default function AddButton({ targetPath, onPress, style }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (targetPath) {
      router.push(targetPath as Href);
    }
  };

  return (
    <Pressable style={[styles.button, style]} onPress={handlePress}>
       <Plus color="white" size={30} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 10,
    position: "absolute",
    top: 25,
    right: 10,
    zIndex: 100,
  },
});