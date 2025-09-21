import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useRouter } from "expo-router";
import { Apple, Bean, Carrot, Drumstick, Flower, Nut, Wheat } from "lucide-react-native";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

type Category = {
  title: string;
  route: string;
  icon: React.ReactNode;
};

export default function Food() {
  const router = useRouter();

  const categories: Category[] = [
    { title: "Zelenina", route: "/actions/food/vegetable", icon: <Carrot color="white" size={20} /> },
    { title: "Ovoce", route: "/actions/food/fruit", icon: <Apple color="white" size={20} /> },
    { title: "Maso", route: "/actions/food/meat", icon: <Drumstick color="white" size={20} /> },
    { title: "Luštěniny", route: "/actions/food/legume", icon: <Bean color="white" size={20} /> },
    { title: "Obiloviny", route: "/actions/food/cereal", icon: <Wheat color="white" size={20} /> },
    { title: "Bylinky", route: "/actions/food/herbs", icon: <Flower color="white" size={20} /> },
    { title: "Ostatní", route: "/actions/food/other", icon: <Nut color="white" size={20} /> },
  ];

  return (
    <MainScreenContainer contentContainerStyle={{position: "relative"}}>
      <CustomHeader backTargetPath="./"/>
      <Title>Vyber kategorii</Title>
      <View style={styles.buttonContainer}>
        {categories.map((category: Category) => (
          <MyButton backgroundColor={COLORS.secundary}
            key={category.route}
            title={category.title}
            onPress={() => router.push(category.route)}
            icon={category.icon} 
          />
        ))}
      </View>
      <Pressable onPress={() => Linking.openURL("https://www.rostemeschuti.cz/")}>
        <Text style={styles.web}>
          Informace čerpány z
        </Text>
        <Text style={styles.webline}>
         www.rostemeschuti.cz/
        </Text>
      </Pressable>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
    gap: 1,
    alignItems: "center",
  },
  web: {
    fontSize: 15,
    color: COLORS.darkRedText,
    textAlign: "center",
    marginTop: 25,
  },
  webline: {
    fontSize: 15,
    color: COLORS.darkRedText,
    textAlign: "center",
    textDecorationLine: "underline"
  },
});