import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChildProvider } from "@/contexts/ChildContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
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
  const { session, isLoading } = useAuth(); 
  const segments = useSegments(); 
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // Pokud není session a uživatel není v login screen, jdi na login
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      // Pokud je session a uživatel je v login screen, jdi domů
      router.replace('/home');
    }
  }, [session, segments, isLoading]);
  if (isLoading) {
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