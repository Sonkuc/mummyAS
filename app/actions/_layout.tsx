import { Stack } from "expo-router";

// Data dětí poskytuje jediný ChildProvider v kořenovém app/_layout.tsx.
// (Dřívější vnořený ChildProvider tady vytvářel druhou, oddělenou kopii dat,
// takže změny v sekci „akce“ nebyly vidět na úvodní obrazovce a naopak.)
export default function ActionsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
