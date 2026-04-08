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
import ValidatedDateInput from "@/components/ValidDateInput";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { File, Paths } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ChildEdit() {
  const router = useRouter();
  const { allChildren, updateChild } = useChild();
  const { id } = useLocalSearchParams<{ id: string }>();

  const currentChild = useMemo(() => 
    allChildren.find((c) => c.id === id), 
    [id, allChildren]
  );

  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (currentChild) {
      setName(currentChild.name);
      setSex(currentChild.sex);
      setPhotoUri(currentChild.photo);
      setBirthDate(new Date(currentChild.birthDate));
    }
  }, [currentChild]);

  const handleSave = async () => {
    if (!currentChild) {
      alert("Dítě nebylo nalezeno.");
      return;
    }

    if (!name.trim() || !sex || !birthDate) {
      alert("Vyplň všechna pole.");
      return;
    }

    // Kontrola duplicity (vynecháme aktuálně editované dítě pomocí ID)
    const duplicate = allChildren.some(
      (c) =>
        c.id !== id &&
        c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        c.birthDate.slice(0, 10) === formatDateLocal(birthDate)
    );

    if (duplicate) {
      alert("Dítě se stejným jménem a datem už existuje.");
      return;
    }

    let finalPhotoUri = currentChild.photo || "anonym";

    // Logika pro zpracování fotky
    if (photoUri && photoUri !== currentChild.photo) {
      const basePhoto = photoUri.split("?")[0];
      if (basePhoto.startsWith("avatar")) {
        finalPhotoUri = basePhoto;
      } else {
        try {
          const sourceFile = new File(basePhoto);
          const destinationFile = new File(Paths.document, `${currentChild.id}.jpg`);
          if (destinationFile.exists) {
            destinationFile.delete();
          }
          sourceFile.copy(destinationFile);
          finalPhotoUri = destinationFile.uri;
        } catch (err) {
          console.error("Chyba při ukládání fotky:", err);
        }
      }
    }

    try {
      const updatedData = {
        ...currentChild, 
        name: name.trim(),
        sex: sex,
        birthDate: formatDateLocal(birthDate),
        photo: finalPhotoUri,
      };

      await updateChild(updatedData);
      
      router.back();
    } catch (error) {
      // Pokud selže něco v kódu, ne kvůli síti
      console.error(error);
      alert("Neočekávaná chyba při ukládání.");
    }
  };

  if (!currentChild) return null;

  return (
    <MainScreenContainer style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <CustomHeader>
          <DeleteButton type="child" childId={currentChild.id} />
        </CustomHeader>

        <Title>Uprav informace</Title>

        <Subtitle>Jméno</Subtitle>
        <MyTextInput 
          placeholder="Jméno" 
          value={name} 
          onChangeText={setName} 
          autoCapitalize="words"
        />
        <Subtitle style={{ marginTop: 10 }}>Datum narození</Subtitle>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ width: "80%" }}>
            <ValidatedDateInput
              value={birthDate ? formatDateLocal(birthDate) : ""}
              onChange={(val) => setBirthDate(val ? new Date(val) : null)}
              birthISO={currentChild.birthDate}
              allowPastDates={true}
              fallbackOnError="original"
              originalValue={currentChild.birthDate}
            />
          </View>
          <DateSelector
            date={birthDate && !isNaN(birthDate.getTime()) ? birthDate : new Date()}
            onChange={(newDate) => setBirthDate(newDate)}
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
      </ScrollView>
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