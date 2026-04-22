import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChildProvider, useChild } from "@/contexts/ChildContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const colorScheme = useColorScheme();

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ChildProvider>
          <RootLayoutNav />
        </ChildProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Vidí na useAuth() a useChild()
function RootLayoutNav() {
  const { session, isLoading: isAuthLoading } = useAuth(); 
  const segments = useSegments(); 
  const router = useRouter();
  const { isDataLoaded } = useChild();

  // Kontrola, zda už Expo Router může navigovat
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    // Pokud ještě zjišťujeme session nebo navigace není připravena, neděláme nic
    if (isAuthLoading || !isReady) return;

    const inAuthGroup = segments[0] === 'auth';

    // Používáme setImmediate nebo setTimeout 0, aby se operace provedla 
    // až po dokončení renderovacího cyklu - bezpečnější pro router.replace
    const timeout = setTimeout(() => {
      if (!session && !inAuthGroup) {
        router.replace('/auth/login');
      } else if (session && inAuthGroup) {
        router.replace('/home');
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [session, segments, isAuthLoading, isReady]);

  // Pokud se vše ještě načítá, zobrazíme splash screen (logo)
  if (isAuthLoading || !isReady || (session && !isDataLoaded)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 350,
    height: 180,
    marginTop: 30,
  },
});