import { COLORS } from "@/constants/MyColors";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  icon?: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
};

export default function MyButton({ title, onPress, icon, style, backgroundColor }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.button, style, backgroundColor && { backgroundColor }]}>
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.text}>{title}</Text>
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
});