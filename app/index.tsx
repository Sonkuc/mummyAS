import { loadChildren } from "@/components/storage/loadChildren";
import { Child } from "@/components/storage/saveChildren";
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();
  const [kids, setKids] = useState<Child[]>([]);

  /* načtení dětí při zobrazení stránky */
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        const loaded = await loadChildren();
        if (isActive) {
          setKids(loaded);
        }
      };

      fetchData();

      return () => {
        isActive = false;
      };
    }, [])
  );

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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Milá maminko, </Text>
          <Text style={styles.subtitle}>vítej 🩷</Text>
          <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
          
          <View style={styles.bottom}>
          <Pressable
            style={styles.button}
            onPress={() => router.replace("/pridat-ditko")}
          >
            <Text style={styles.buttonText}>Přidat dítko</Text>
          </Pressable>
        
        </View>
          {kids.length === 0 ? (
            <Text style={styles.subtitle}>Zatím není přidáno žádné dítě.</Text>
          ) : (
            kids.map((kid, idx) => (
              <View key={idx} style={[
                styles.childCard, 
                {
                  backgroundColor: getCardColor(kid.pohlavi),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
              ]}>
                 {/* Fotka a jméno */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {kid.foto && (
                      <Image
                        source={{ uri: kid.foto }}
                        style={styles.childImage}
                        resizeMode="cover"
                      />
                    )}
                <Text style={styles.name}>{kid.jmeno}</Text>
                </View>
                <Pressable 
                  onPress={() => 
                    router.push({
                      pathname: "/upravit-ditko", 
                      params: { index: idx.toString()},
                    })
                  }
                >
                  <FontAwesome
                    name="pencil"
                    size={24}
                    style= {{
                      marginRight: 10,
                      color: getIconColor(kid.pohlavi),
                      }}/>

                </Pressable>
              </View>
            ))
          )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff0f5",
  },
  container: {
    flexGrow: 1,               // aby zabíral celý ScrollView
    justifyContent: 'center',  // svislé zarovnání na střed
    alignItems: 'center',      // vodorovné zarovnání na střed
    padding: 20,
    backgroundColor: '#fff0f5',
  },
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
    alignItems: "center",
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
  editText: {
    fontSize: 18,
    marginLeft: 10,
  },
  childImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
});
