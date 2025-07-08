import EditPencil from "@/components/EditPencil";
import MainScreenContainer from "@/components/MainScreenContainer";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
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
        <MainScreenContainer contentContainerStyle={{
          justifyContent: "center",
          alignItems: "center",
        }}>
          <Text style={styles.title}>Milá maminko, </Text>
          <Text style={styles.subtitle}>vítej 🩷</Text>
          <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
          
          <View style={styles.bottom}>
          <Pressable
            style={styles.button}
            onPress={() => router.push("/child-add")}
          >
            <Text style={styles.buttonText}>Přidat dítko</Text>
          </Pressable>
        
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
                    style={{ flexDirection: "row", alignItems: "center" }}>
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
    color: "#992769",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 27,
    color: "#bf5f82",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  bottom: {
    marginBottom: 40, 
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
});
