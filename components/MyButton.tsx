import { COLORS } from "@/constants/MyColors";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  icon?: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
};

export default function MyButton({ title, onPress, icon, style, backgroundColor, disabled }: Props) {
  return (
    <Pressable 
      onPress={disabled ? undefined : onPress} 
      style={[styles.button, style, backgroundColor && { backgroundColor }, disabled && styles.disabled]}
    >
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, disabled && styles.disabledText]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 40,
    width: "80%", 
    alignSelf: "center",
  },
  text: {
    color: "white",
    fontSize: 18,
  },
  icon: {
    marginRight: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: "#ccc",
  },
  disabledText: {
    color: "#999",
  },
});