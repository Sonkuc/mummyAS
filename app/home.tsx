import EditPencil from "@/components/EditPencil";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import { getPhotoSource } from "@/components/PhotoFunctions";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import {
  Heart
} from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();
  const { allChildren, setSelectedChildId } = useChild();

  const getCardColor = (gender: string) =>
    gender === "chlapec" ? COLORS.boyCard :
    gender === "divka"   ? COLORS.girlCard :
    "lightgray";

  const getIconColor = (gender: string) =>
    gender === "chlapec" ? COLORS.boyIcon :       
    gender === "divka"   ? COLORS.girlIcon :      
    "gray";   
    return (
    <MainScreenContainer scrollable contentContainerStyle={{ alignItems: "center" }}>
      <View style={{ justifyContent: "center", alignItems: "center", marginTop: 60, marginBottom: 30}}>
        <Text style={styles.title}>Milá maminko, </Text>
        <View style={styles.row}>
          <Text style={styles.subtitle}>vítej </Text>
          <Heart color={COLORS.primary} size={28} />
        </View>
        <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
        </View>
      <View style={styles.bottom}>
        <MyButton title="Přidat dítko" onPress={() => router.push("/child-add")}/>  
      </View>
      {allChildren.length === 0 ? (
        <Text style={styles.subtitle}>Zatím nebylo přidáno žádné dítě.</Text>
      ) : (
        allChildren.map((kid, idx) => (
          <Pressable 
            onPress={async () => {
              await setSelectedChildId(kid.id);
              router.push("/actions");
            }} 
            key={kid.id}
            style={[
              styles.childCard, 
              { backgroundColor: getCardColor(kid.sex)},
            ]}>
            <View style={styles.row}>
              {kid.photo && (
                <Image
                  source={getPhotoSource(kid.photo)}
                  style={styles.childImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.name}>{kid.name}</Text>
            </View>
            <EditPencil
              color={getIconColor(kid.sex)}
              onPress={async () => {
                await setSelectedChildId(kid.id);
                router.push({
                  pathname: "/child-edit",
                  params: { id: kid.id }
                });
              }}
            />
          </Pressable>
        ))
      )}
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
