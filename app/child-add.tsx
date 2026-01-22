import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import PhotoChooser from "@/components/PhotoChooser";
import * as api from "@/components/storage/api";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import uuid from "react-native-uuid";

export default function ChildAdd() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { reloadChildren, setSelectedChildId, allChildren } = useChild();

  const childId = useMemo(() => uuid.v4() as string, []);

  const handleSave = async () => {
    if (!name.trim() || !sex || !birthDate) {
      alert("Vyplň všechna pole.");
      return;
    }

    if (isNaN(birthDate.getTime())) {
      alert("Datum narození není platné.");
      return;
    }

    const duplicate = allChildren.some(c => 
      c.name.trim().toLowerCase() === name.toLowerCase() && 
      c.birthDate.slice(0, 10) === formatDateLocal(birthDate)
    );
    if (duplicate) {
      alert("Toto dítě už je přidáno.");
      return;
    }

    let finalPhotoUri = "anonym";

    if (photoUri) {
      if (photoUri.startsWith("avatar")) {
        finalPhotoUri = photoUri;
      } else {
        const docDir = FileSystem.documentDirectory ?? "";
        if (photoUri.startsWith("file://") || photoUri.startsWith(docDir)) {
          const newPath = `${docDir}${childId}.jpg`;
          try {
            if (photoUri !== newPath) {
              await FileSystem.deleteAsync(newPath, { idempotent: true });
              await FileSystem.copyAsync({ from: photoUri, to: newPath });
            }
            finalPhotoUri = newPath;
          } catch (err) {
            console.error("Chyba při ukládání fotky:", err);
          }
        } else {
          finalPhotoUri = photoUri;
        }
      }     
    }

    const childData = {
      name: name.trim(),
      sex: sex,
      birthDate: formatDateLocal(birthDate),
      photo: finalPhotoUri,
    };

    try {
      // 1. Uložíme dítě a chytíme si odpověď z backendu
      // Předpokládám, že createChild vrací objekt vytvořeného dítěte i s jeho ID
      const savedChild = await api.createChild(childData);

      // 2. Refreshneme seznam dětí z backendu
      await reloadChildren();

      // 3. TADY použijeme setSelectedChildId
      if (savedChild && savedChild.id) {
        await setSelectedChildId(savedChild.id);
      }
      
      router.back();
    } catch (error) {
      console.error(error);
      alert("Nepodařilo se uložit dítě na server.");
    }
  };

  return (
    <MainScreenContainer>
      <CustomHeader/> 
      <Title>Zadej informace</Title>
      <Subtitle>Jméno</Subtitle>

      <MyTextInput
        placeholder="Jméno"
        value={name}
        autoCapitalize="words"
        onChangeText={setName}
      />

      <Subtitle style={{marginTop: 10}}>Datum narození</Subtitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
        <View style={{ width: "80%" }}>
          <ValidatedDateInput
            value={formatDateLocal(birthDate)}
            onChange={(val) => {
              if (val && val.length === 10) {
                const [y, m, d] = val.split("-").map(Number);
                const newD = new Date(y, m - 1, d);
                if (!isNaN(newD.getTime())) setBirthDate(newD);
              }
            }}
            allowPastDates={true}
            fallbackOnError="original"
            originalValue={formatDateLocal(new Date())}
          />
        </View>
        <DateSelector
          date={birthDate}
          onChange={setBirthDate}
        />
      </View>

      <View style={styles.genderContainer}>
        <Pressable
          style={[
            styles.genderButton,
            sex === "chlapec" && styles.genderSelected,
          ]}
          onPress={() => setSex("chlapec")}
        >
          <Text style={[
            sex === "chlapec" && styles.genderTextSelected,
          ]}>Chlapec</Text>
        </Pressable>

        <Pressable
          style={[
            styles.genderButton,
            sex === "divka" && styles.genderSelected,
          ]}
          onPress={() => setSex("divka")}
        >
          <Text style={[
            sex === "divka" && styles.genderTextSelected,
          ]}>Dívka</Text>
        </Pressable>
      </View>

      <PhotoChooser
        childId={childId}
        initialUri={null}
        onSelect={(uri) => setPhotoUri(uri)}
      />
      <CheckButton style={{marginBottom: 20}} onPress = {handleSave} /> 

    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
    marginBottom: 40,
  },
  genderButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: 80,
    justifyContent: "center",
    alignItems: "center", 
  },
  genderSelected: {
    backgroundColor: COLORS.primary,
  },
  genderTextSelected: {
    color: "white",
  },
});