import { COLORS } from "@/constants/MyColors";
import React from "react";
import { StyleSheet, Text, TextStyle, ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: TextStyle | ViewStyle;
};

export default function Subtitle({ children, style }: Props) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
    subtitle: {
        fontSize: 20,
        color: COLORS.primary,
        marginBottom: 10,
      },
});