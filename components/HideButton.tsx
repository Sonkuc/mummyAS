import { COLORS } from "@/constants/MyColors";
import { Eye, EyeOff } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  onPress?: () => void;
  hideMode?: boolean;
}; 

export default function HideButton({ onPress, hideMode = false }: Props) {
  const handlePress = ()=> {
    onPress?.();
  };

    return (
    <Pressable style={styles.button} onPress={handlePress}>
       {hideMode ? (
        <EyeOff color="white" size={25} />
      ) : (
        <Eye color="white" size={25} />
      )}
    </Pressable>
  );
}

 
const styles = StyleSheet.create({
  button: {
    width: 35,
    height: 35,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});