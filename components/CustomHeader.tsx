import React from "react";
import { StyleSheet, View } from "react-native";
import BackButton from "./BackButton";

type CustomHeaderProps = {
  children?: React.ReactNode;
};

export default function CustomHeader({ children }: CustomHeaderProps) {
  return (
    <View style={styles.header}>
      <BackButton />
      { children }
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 40,
    paddingTop: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff0f5",
    justifyContent: "center",
    position: "relative",
  },
});
