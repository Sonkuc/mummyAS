import { StyleSheet, Text } from "react-native";

export default function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 70,
    color: "#993769",
  },
});