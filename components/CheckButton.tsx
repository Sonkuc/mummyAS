import { COLORS } from "@/constants/MyColors";
import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

type Props = {
  onPress: () => void;
  style?: ViewStyle;
};

export default function CheckButton({ onPress, style }: Props){ 

  return (
    <TouchableOpacity onPress={() => onPress()} style={[styles.checkButton, style]} activeOpacity={0.8}>
       <FontAwesome name="check" size={28} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
    bottom: 10,
    position: "absolute",
    alignSelf: "center",
  },
});