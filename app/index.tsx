import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { Image, StyleSheet, View } from "react-native";

export default function Index() {
  const { session, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.logoWrapper}>
          <Image 
            source={require("@/assets/images/logo2.png")} 
            style={styles.logo} 
          />
      </View>
    );
  }

  return <Redirect href={session || isGuest ? "/home" : "/auth/login"} />;
}

const styles = StyleSheet.create({
  logoWrapper: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    backgroundColor: "red",
},
  logo: {
    width: 350,
    height: 180,
  },
});