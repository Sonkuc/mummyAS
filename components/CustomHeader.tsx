import React from "react";
import { StyleSheet, View } from "react-native";
import BackButton from "./BackButton";

type CustomHeaderProps = {
  children?: React.ReactNode;
  backTargetPath?: string;
};

export default function CustomHeader({ children, backTargetPath  }: CustomHeaderProps) {
  return (
    <View style={styles.header}>
      <BackButton targetPath={backTargetPath}/>
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
