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

    let finalPhotoUri = "anonym";

    if (photoUri) {
  const basePhoto = photoUri.split("?")[0];

  if (basePhoto.startsWith("avatar")) {
    // uložit čisté id avatara
    finalPhotoUri = basePhoto;
  } else {
    // jedná se o file:// nebo path v documentDirectory
    const docDir = FileSystem.documentDirectory ?? "";
    // pokud už je uložené v docDir (např. newPath), nech to být, jinak zkopíruj
    const sourceUri = basePhoto; // bez ?t
    const newPath = `${docDir}${currentChild.id}.jpg`;
    try {
      if (sourceUri !== newPath) {
        await FileSystem.deleteAsync(newPath, { idempotent: true });
        await FileSystem.copyAsync({ from: sourceUri, to: newPath });
      }
      finalPhotoUri = newPath;
    } catch (err) {
      console.error("Chyba při ukládání fotky:", err);
      // případně fallback na anonym nebo původní currentChild.photo
      finalPhotoUri = currentChild.photo || "anonym";
    }
  }
}

    const photoChanged = photoUri !== currentChild.photo;

    const noChanges =
      name === currentChild.name &&
      sex === currentChild.sex &&
      formatDateLocal(birthDate) === currentChild.birthDate &&
      !photoChanged;

    if (noChanges) return;

    await updateChild({
      ...currentChild,
      name,
      sex,
      birthDate: formatDateLocal(birthDate),
      photo: finalPhotoUri,
    });

    if (selectedChildIndex !== null) {
      await setSelectedChildIndex(selectedChildIndex, true); // např. přidej parametr "refresh"
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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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
           onChange={(newDate) => {
            if (!newDate) {
              // obnov původní datum narození
              if (currentChild?.birthDate) {
                setBirthDate(new Date(currentChild.birthDate));
              }
              return;
            }
            setBirthDate(newDate);
          }}
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