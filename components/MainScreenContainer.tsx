import { ReactNode } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
};

export default function MainScreenContainer({ 
    children, 
    scrollable = true,
    contentContainerStyle,
    style
 }: Props) {
    if (scrollable) {
       return (
      <ScrollView
        contentContainerStyle={[styles.container, contentContainerStyle]}
        style={style}
      >
        {children}
      </ScrollView>
    );
  } else {
    return (
      <View style={[styles.container, style]}>
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff0f5",
    position: "relative",
  },
});