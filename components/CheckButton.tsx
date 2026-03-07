import { COLORS } from "@/constants/MyColors";
import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

type Props = {
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
};

export default function CheckButton({ onPress, style, disabled }: Props) { 

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[
        styles.checkButton, 
        style, 
        disabled && styles.disabledButton // Jen když disabled true
      ]} 
      activeOpacity={0.8}
      disabled={disabled} // Zabrání volání onPress
    >
        <FontAwesome 
            name="check" 
            size={28} 
            color={disabled ? "#E0E0E0" : "#fff"} // Mírně změní barvu fajfky
        />
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
  // Styl pro neaktivní tlačítko
  disabledButton: {
    backgroundColor: "#ccc",
    shadowOpacity: 0, // Odstranění stínu
    elevation: 0,
  },
});