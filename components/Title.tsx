import { StyleSheet, Text, TextStyle, ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: TextStyle | ViewStyle;
};

export default function Subtitle({ children, style }: Props) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    textAlign: "center",
    color: "#993769",
    marginTop: 50,
    marginBottom: 20,
  },
});