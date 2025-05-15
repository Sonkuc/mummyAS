import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useLayoutEffect } from "react";
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Domov",
      headerShown: false,
    });
  }, [navigation]);

  return (
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Milá maminko, </Text>
        <Text style={styles.subtitle}>vítej 🩷</Text>
        <Image source={require("/home/sona/mummyAS/assets/images/logo2.png")} style={styles.logo} />
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/pridat-ditko")}
        >
          <Text style={styles.buttonText}>Přidat dítko</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff0f5",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff0f5",
    padding: 20,
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
    padding: 20,
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
    marginTop: 100,
  },
});
