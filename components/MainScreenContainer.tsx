import { COLORS } from "@/constants/MyColors";
import { ReactNode } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
};

export default function MainScreenContainer({
  children,
  scrollable = false,
  style,
  contentContainerStyle
}: Props) {
  if (scrollable) {
    return (
      <View style={[styles.wrapper, style]}>
        <ScrollView contentContainerStyle={[styles.container, contentContainerStyle]}>
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.backgroundContainer,
    position: "relative",
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
});