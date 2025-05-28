import { StyleSheet, Text } from "react-native";

export default function Subtitle({ children }: { children: string }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

const styles = StyleSheet.create({
    subtitle: {
        fontSize: 20,
        color: "#bf5f82",
        marginBottom: 5,
      },
});