import { avatars } from "@/assets/images/avatars";
import { COLORS } from "@/constants/MyColors";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import MyButton from "./MyButton";

type Props = {
  childId: string;
  onSelect: (uri: string) => void; // vrací uložený URI (avatar nebo vlastní fotka)
  initialUri?: string | null; // výchozí hodnota (z uložených dat)
};

export default function PhotoChooser({ childId, onSelect, initialUri }: Props) {
  const [previewUri, setPreviewUri] = useState<string | null>(initialUri ?? null);

  useEffect(() => {
    if (initialUri) {
      setPreviewUri(initialUri);
      onSelect(initialUri); // jen čistá cesta
    }
  }, [initialUri]);

  function withTimestamp(uri: string): string {
    const docDir = FileSystem.documentDirectory ?? "";
    if (uri.startsWith("file://") || uri.startsWith(docDir)) {
      return `${uri}?t=${Date.now()}`;
    }
    return uri; // asset:/ a http:// necháme čisté
  }

  const pickFromLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!res.canceled && res.assets.length) {
      const pickedUri = res.assets[0].uri;
      const newPath = (FileSystem.documentDirectory ?? "") + `${childId}.jpg`;

      try {
        await FileSystem.deleteAsync(newPath, { idempotent: true });
        await FileSystem.copyAsync({ from: pickedUri, to: newPath });

        // do preview dáme ?t=..., do onSelect čistou cestu
        setPreviewUri(`${newPath}?t=${Date.now()}`);
        onSelect(newPath);
      } catch (err) {
        console.error("Chyba při ukládání fotky:", err);

        // fallback
        setPreviewUri(`${pickedUri}?t=${Date.now()}`);
        onSelect(pickedUri);
      }
    }
  };

  const renderAvatar = ({ item }: { item: { id: string; source: any } }) => {
    const uri = Image.resolveAssetSource(item.source).uri;
    return (
      <Pressable
        onPress={() => {
          setPreviewUri(uri); // pro náhled čistě (bez ?t, protože je to asset)
          onSelect(uri); // uložit čistě
        }}
        style={[
          styles.avatarWrapper,
          previewUri?.startsWith(uri) && styles.avatarSelected,
        ]}
      >
        <Image source={item.source} style={styles.avatarImg} />
      </Pressable>
    );
  };

  return (
    <View>
      <MyButton
        style={{ marginBottom: 15 }}
        title="Vyber obrázek"
        onPress={pickFromLibrary}
      />

      <Text style={styles.subtitle}>Nebo avatar:</Text>

      <View style={{ height: 100 }}>
        <FlatList
          data={avatars}
          horizontal
          renderItem={renderAvatar}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.avatarList}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {previewUri && (
        <Image
          source={{ uri: withTimestamp(previewUri) }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            alignSelf: "center",
            marginVertical: 10,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarList: { marginTop: 10 },
  avatarWrapper: {
    marginRight: 10,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    width: 70,
    height: 90,
  },
  avatarSelected: { borderColor: COLORS.primary },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    resizeMode: "cover",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
