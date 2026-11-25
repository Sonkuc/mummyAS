import { avatars } from "@/assets/images/avatars";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export function getPhotoSource(photoUri: string | null) {
  const anonym = avatars.find(a => a.id === "anonym")?.source;

  if (!photoUri || photoUri === "anonym") return anonym;

  // Web: fotka uložená jako data URL (base64)
  if (photoUri.startsWith("data:")) return { uri: photoUri };

  // odstranit query parametry typu ?t=...
  const baseUri = photoUri.split("?")[0];

  if (baseUri.startsWith("avatar")) {
    const avatar = avatars.find(a => a.id === baseUri);
    return avatar ? avatar.source : anonym;
  }

  // vlastní fotka z FileSystem – přidáat timestamp, zamezení cache
  const docDir = Platform.OS === "web" ? "" : FileSystem.documentDirectory ?? "";
  if (baseUri.startsWith("file://") || (docDir && baseUri.startsWith(docDir))) {
    return { uri: `${baseUri}?t=${Date.now()}` };
  }

  // fallback, pokud zadáno http URL
  return { uri: baseUri };
}

/**
 * Jen pro web: zmenší vybraný obrázek (max. strana maxSize px) a vrátí ho
 * jako JPEG data URL, které se uloží do pole `photo` místo cesty k souboru.
 */
export function resizeImageForWeb(uri: string, maxSize = 512, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas není dostupný"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Obrázek se nepodařilo načíst"));
    img.src = uri;
  });
}
