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
        <Eye color="white" size={25} />
      ) : (
        <EyeOff color="white" size={25} />
      )}
    </Pressable>
  );
}

 
const styles = StyleSheet.create({
  button: {
    position: "absolute",      // <– důležité pro umístění
    bottom: 20,                // <– vzdálenost od spodního okraje
    right: 20,                 // <– vzdálenost od pravého okraje
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgb(164, 91, 143)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,                // <– zajistí, že bude vidět nad ostatními
  },
});