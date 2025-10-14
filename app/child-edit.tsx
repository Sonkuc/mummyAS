import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import DeleteButton from "@/components/DeleteButton";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import PhotoChooser from "@/components/PhotoChooser";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDate";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ChildEdit() {
  const router = useRouter();
  const { selectedChildIndex, allChildren, updateChild, setSelectedChildIndex } = useChild();

  const childIdx = selectedChildIndex;
  const isValidIndex =
    childIdx !== null && childIdx >= 0 && childIdx < allChildren.length;

  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(
    isValidIndex ? new Date(allChildren[childIdx].birthDate) : null
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const anonymPicture = require("../assets/images/avatars/avatarN0.jpg");

  function normalizeUri(uri: string): string {
    return uri.split("?")[0]; // odřízne ?t=...
  }

  useEffect(() => {
    if (isValidIndex) {
      const kid = allChildren[childIdx];
      setName(kid.name);
      setSex(kid.sex);
      setPhotoUri(kid.photo);
    }
  }, [childIdx, isValidIndex, allChildren]);

  const handleSave = async () => {
    if (!isValidIndex) {
      alert("Neplatný index dítěte.");
      return;
    }

    if (!name.trim() || !sex || !birthDate) {
      alert("Vyplň všechna pole.");
      return;
    }

    if (isNaN(birthDate.getTime())) {
      alert("Datum narození není platné.");
      return;
    }

    const updated = [...allChildren];
    const currentChild = updated[childIdx];

    const duplicate = allChildren.some(
      (c, i) =>
        i !== childIdx &&
        c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        c.birthDate.slice(0, 10) === formatDateLocal(birthDate)
    );

    if (duplicate) {
      alert("Dítě se stejným jménem a datem už existuje.");
      return;
    }

    let finalPhotoUri: string;

    if (photoUri) {
      const cleanUri = normalizeUri(photoUri);
      const docDir = FileSystem.documentDirectory ?? "";

      if (cleanUri.startsWith("file://") || cleanUri.startsWith(docDir)) {
        const newPath = FileSystem.documentDirectory + `${currentChild.id}.jpg`;
        try {
          if (cleanUri !== newPath) {
            await FileSystem.deleteAsync(newPath, { idempotent: true });
            await FileSystem.copyAsync({ from: cleanUri, to: newPath });
          }
          finalPhotoUri = newPath;
        } catch (err) {
          console.error("Chyba při ukládání fotky:", err);
          finalPhotoUri = cleanUri;
        }
      } else {
        finalPhotoUri = cleanUri;
      }
    } else {
      finalPhotoUri = Image.resolveAssetSource(anonymPicture).uri;
    }

    const noChanges =
      name === currentChild.name &&
      sex === currentChild.sex &&
      formatDateLocal(birthDate) === currentChild.birthDate &&
      photoUri === currentChild.photo;

    if (noChanges) {
      return;
    }

    await updateChild({
      ...currentChild,
      name,
      sex,
      birthDate: formatDateLocal(birthDate),
      photo: finalPhotoUri,
    });

    if (selectedChildIndex !== null) {
      await setSelectedChildIndex(selectedChildIndex);
    }

    router.back();
  };

  if (!isValidIndex) return null;

  const currentChild = allChildren[childIdx];

  return (
    <MainScreenContainer>
      <CustomHeader>
        <DeleteButton type="child" index={childIdx} />
      </CustomHeader>

      <Title>Uprav informace</Title>

      <Subtitle>Jméno</Subtitle>
      <MyTextInput placeholder="Jméno" value={name} onChangeText={setName} />

      <Subtitle style={{ marginTop: 10 }}>Datum narození</Subtitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 25 }}>
        <View style={{ width: "80%" }}>
          <ValidatedDateInput
            value={birthDate ? formatDateLocal(birthDate) : ""}
            onChange={(val) => setBirthDate(val ? new Date(val) : null)}
            birthISO={currentChild.birthDate}
            allowPastDates
            fallbackOnError="original"
          />
        </View>
        <DateSelector
          date={birthDate && !isNaN(birthDate.getTime()) ? birthDate : new Date()}
          onChange={setBirthDate}
        />
      </View>

      <View style={styles.genderContainer}>
        <Pressable
          style={[styles.genderButton, sex === "chlapec" && styles.genderSelected]}
          onPress={() => setSex("chlapec")}
        >
          <Text style={[sex === "chlapec" && styles.genderTextSelected]}>
            Chlapec
          </Text>
        </Pressable>

        <Pressable
          style={[styles.genderButton, sex === "divka" && styles.genderSelected]}
          onPress={() => setSex("divka")}
        >
          <Text style={[sex === "divka" && styles.genderTextSelected]}>
            Dívka
          </Text>
        </Pressable>
      </View>

      <PhotoChooser
        childId={currentChild.id}
        initialUri={currentChild.photo}
        onSelect={(uri) => setPhotoUri(uri)}
      />

      <CheckButton style={{ marginBottom: 20 }} onPress={handleSave} />
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
