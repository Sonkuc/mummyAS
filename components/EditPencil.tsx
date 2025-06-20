import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  targetPath?: string | { pathname: string; params: Record<string, string> };
  color: string | (() => string);
  circle?: boolean;
  onPress?: () => void;
  editMode?: boolean;
};

export default function EditPencil({ targetPath, color, circle = false, onPress, editMode = false }: Props) {
    const router = useRouter();
    const iconColor = typeof color === "function" ? color() : color;

    const handlePress = () => {
      if (onPress) {
        onPress();
      } if (targetPath) {
        router.push(targetPath);
        }
    };
    
    const iconName = editMode ? "times" : "pencil";
    const circleStyle = {
      ...styles.circleButton,
      backgroundColor: editMode ? "crimson" : "rgb(164, 91, 143)",
    };

return (
    <Pressable style={circle ? circleStyle : undefined} onPress={handlePress}>
      <FontAwesome
        name={iconName}
        size={24}
        color={iconColor}
        style= {!circle ? { marginRight: 10 } : undefined}
      />
    </Pressable>
)}

const styles = StyleSheet.create({
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: "rgb(164, 91, 143)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 10,
    position: "absolute",
    bottom: 25,
    right: 30,
    elevation: 5, // pro Android stín
    shadowColor: "#000", // pro iOS stín
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});