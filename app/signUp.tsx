import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { Image, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();
  const { setSelectedChildIndex, allChildren } = useChild();

  const getCardColor = (gender: string) =>
    gender === "chlapec" ? COLORS.boyCard :
    gender === "divka"   ? COLORS.girlCard :
    "lightgray";

  const getIconColor = (gender: string) =>
    gender === "chlapec" ? COLORS.boyIcon :       
    gender === "divka"   ? COLORS.girlIcon :      
    "gray";   

  return (
    <MainScreenContainer scrollable contentContainerStyle={{
      justifyContent: "center",
      alignItems: "center",
    }}>
      <Text style={styles.title}>Milá maminko, </Text>
      <View style={styles.row}>
        <Text style={styles.subtitle}>vítej </Text>
        <Heart color={COLORS.primary} size={28} />
      </View>
      <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
          
      <View style={styles.bottom}>
        <MyButton title="Přeskočit" onPress={() => router.push("/child-add")}/>  
      </View>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 35,
    color: COLORS.primary,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 27,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  bottom: {
    padding: 30,
    backgroundColor: "#fff0f5",
  },
  logo: {
    width: 350,
    height: 180,
    marginTop: 30,
  },
  childCard: {
    padding: 5,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: "#aaa",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    width: '80%',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontWeight: "bold",
    fontSize: 18,
  },
  childImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  }
});
