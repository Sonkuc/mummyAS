import { COLORS } from "@/constants/MyColors";
import { ArrowDown10, ArrowDownAZ } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  onPress?: () => void;
  sortOn?: "abc" | "dated";
}; 

export default function SortButton({ onPress, sortOn = "abc" }: Props) {
  const handlePress = ()=> {
    onPress?.();
  };

    return (
    <Pressable style={styles.button} onPress={handlePress}>
       {sortOn === "abc" ? (
        <ArrowDown10 color="white" size={25} />
      ) : (
        <ArrowDownAZ color="white" size={25} />
      )}
    </Pressable>
  );
}

 
const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 10,
    position: "absolute",
    bottom: 25,
    left: 30,
    zIndex: 100,
  },
});