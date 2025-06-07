import { ThemedText } from '@/components/ThemedText';
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import MainScreenContainer from "../components/MainScreenContainer";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <MainScreenContainer scrollable={false}
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}>
          <ThemedText type="title">This screen does not exist.</ThemedText>
          <Link href="/" style={styles.link}>
            <ThemedText type="link">Go to home screen!</ThemedText>
          </Link>
      </MainScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
