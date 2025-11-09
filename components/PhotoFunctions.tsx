import { avatars } from "@/assets/images/avatars";
import * as FileSystem from "expo-file-system/legacy";

export function getPhotoSource(photoUri: string | null) {
  const anonym = avatars.find(a => a.id === "anonym")?.source;

  if (!photoUri || photoUri === "anonym") return anonym;

  // odstranit query parametry typu ?t=...
  const baseUri = photoUri.split("?")[0];

  if (baseUri.startsWith("avatar")) {
    const avatar = avatars.find(a => a.id === baseUri);
    return avatar ? avatar.source : anonym;
  }

  // vlastní fotka z FileSystem – přidáat timestamp, zamezení cache
  const docDir = FileSystem.documentDirectory ?? "";
  if (baseUri.startsWith("file://") || baseUri.startsWith(docDir)) {
    return { uri: `${baseUri}?t=${Date.now()}` };
  }

  // fallback, pokud zadáno http URL
  return { uri: baseUri };
}
