import { avatars } from "@/assets/images/avatars";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import MyButton from "./MyButton";

type Props = {
  onSelect: (uri: string) => void; // vrací vybraný obrázek (asset URI nebo local URI)
};

export default function PhotoChooser({ onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  /* --- nahrání vlastní fotky --- */
  const pickFromLibrary = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!res.canceled && res.assets.length) {
      const uri = res.assets[0].uri;
      setSelected(uri);
      onSelect(uri);
    }
  };

  /* --- render avataru (FlatList item) --- */
  const renderAvatar = ({ item }: { item: { id: string; source: any } }) => (
    <Pressable
      onPress={() => {
        setSelected(item.id);
        onSelect(Image.resolveAssetSource(item.source).uri); // vrací uri pro AsyncStorage
      }}
      style={[
        styles.avatarWrapper,
        selected === item.id && styles.avatarSelected,
      ]}
    >
      <Image source={item.source} style={styles.avatarImg} />
    </Pressable>
  );

  return (
    <View>
      {/* tlačítko pro vlastní fotku */}
      <MyButton title="Vyber obrázek" onPress={pickFromLibrary} />

      {/* titulek */}
      <Text style={styles.subtitle}>Nebo avatar:</Text>

      {/* mřížka avatarů*/}
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
  avatarSelected: { borderColor: "#a45b8f" },
  avatarImg:  {
    width: "100%",
    height: "100%",
    borderRadius: 50, 
    resizeMode: "cover",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },
});
