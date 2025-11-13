import { COLORS } from "@/constants/MyColors";
import React from "react";
import { StyleSheet, View } from "react-native";
import BackButton from "./BackButton";

type CustomHeaderProps = {
  children?: React.ReactNode;
  backTargetPath?: string;
  onPress?: () => void;
};

export default function CustomHeader({ children, backTargetPath, onPress  }: CustomHeaderProps) {
  return (
    <View style={styles.header}>
      <BackButton targetPath={backTargetPath} onPress={onPress}/>
      { children }
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 40,
    paddingTop: 15,
    paddingHorizontal: 10,
    backgroundColor: COLORS.backgroundContainer,
    justifyContent: "center",
    position: "relative",
  },
});
