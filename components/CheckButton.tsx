import { FontAwesome } from "@expo/vector-icons";
import { GestureResponderEvent, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  onPress: (event: GestureResponderEvent) => void;
};

export default function CheckButton({ onPress }: Props){ 

  return (
    <TouchableOpacity onPress={onPress} style={styles.checkButton} activeOpacity={0.7}>
       <FontAwesome name="check" size={40} color="#rgb(7, 208, 48)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    checkButton: {
        marginBottom: 70,
        padding: 3,
        alignItems: "center",
        borderRadius: 10,
        justifyContent: "center",
        elevation: 3,
        backgroundColor: "rgba(164, 91, 143, 0.45)",
      }
});