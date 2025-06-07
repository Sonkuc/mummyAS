import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ChildProvider } from "../../contexts/ChildContext";

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ChildProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="breastfeeding" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="food" />
          <Stack.Screen name="progress" />
          <Stack.Screen name="sleep" />
          <Stack.Screen name="speaking" />
          <Stack.Screen name="teeth" />
          <Stack.Screen name="weight-height" />
        </Stack>
        <StatusBar style="auto" />
      </ChildProvider>
    </ThemeProvider>
  );
}
