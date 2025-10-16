import { avatars } from "@/assets/images/avatars";
import * as FileSystem from "expo-file-system/legacy";

export function getPhotoSource(photoUri: string | null) {
  const anonym = avatars.find(a => a.id === "anonym")?.source;

  // Pokud je null nebo "anonym", použijeme anonymní avatar
  if (!photoUri || photoUri === "anonym") return anonym;

  if (photoUri.startsWith("avatar")) {
    const avatar = avatars.find(a => a.id === photoUri);
    return avatar ? avatar.source : anonym;
  }

  // vlastní fotka z FileSystem – přidáme timestamp, aby se zamezilo cache
  const docDir = FileSystem.documentDirectory ?? "";
  if (photoUri.startsWith("file://") || photoUri.startsWith(docDir)) {
    return { uri: `${photoUri}?t=${Date.now()}` };
  }

  // fallback, pokud by někdo zadal http URL
  return { uri: photoUri };
}