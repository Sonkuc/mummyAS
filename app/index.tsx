import EditPencil from "@/components/EditPencil";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();
  const { setSelectedChildIndex, allChildren } = useChild();

  const getCardColor = (gender: string) =>
    gender === "chlapec" ? "#add8e6" :
    gender === "divka"   ? "#ffc0cb" :
    "lightgray";

  const getIconColor = (gender: string) =>
    gender === "chlapec" ? "#00008b" :       // tmavě modrá
    gender === "divka"   ? "#8b0000" :       // tmavě červená
    "gray";   

  /* render */
  return (
        <MainScreenContainer scrollable contentContainerStyle={{
          justifyContent: "center",
          alignItems: "center",
        }}>
          <Text style={styles.title}>Milá maminko, </Text>
          <View style={styles.row}>
            <Text style={styles.subtitle}>vítej </Text>
            <Heart color="#993769" size={28} />
          </View>
          <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
          
          <View style={styles.bottom}>
          <MyButton title="Přidat dítko" onPress={() => router.push("/child-add")}/>
        
        </View>
          {allChildren.length === 0 ? (
            <Text style={styles.subtitle}>Zatím není přidáno žádné dítě.</Text>
          ) : (
            allChildren.map((kid, idx) => (
              <Pressable 
                onPress={() => {
                  setSelectedChildIndex(idx);
                  router.push({
                    pathname: "/actions" });
                    }} 
                    key={idx} style={[
                styles.childCard, 
                {
                  backgroundColor: getCardColor(kid.sex),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
              ]}>
                 {/* Fotka a jméno */}
                  <View
                    style={styles.row}>
                    {kid.photo && (
                      <Image
                        source={{ uri: kid.photo }}
                        style={styles.childImage}
                        resizeMode="cover"
                      />
                    )}
                <Text style={styles.name}>{kid.name}</Text>
                </View>
                <EditPencil
                  targetPath="/child-edit"
                  color={getIconColor(kid.sex)}
                  onPress={() => setSelectedChildIndex(idx)}
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
    color: "#993769",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 27,
    color: "#993769",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  bottom: {
    padding: 30,
    backgroundColor: "#fff0f5",
  },
  button: {
    backgroundColor: "rgb(164, 91, 143)",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  logo: {
    width: 350,
    height: 180,
    marginTop: 30,
  },
  childCard: {
    backgroundColor: "rgb(164, 91, 143)",
    padding: 5,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: "#aaa",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    width: '80%'
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
