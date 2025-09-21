import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function ({ children, style, ...rest }: Props) {
  return (
    <View style={[styles.group, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
    group: {
    marginVertical: 5,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

