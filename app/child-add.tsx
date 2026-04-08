import CheckButton from "@/components/CheckButton";
import CustomHeader from "@/components/CustomHeader";
import DateSelector from "@/components/DateSelector";
import { formatDateLocal } from "@/components/IsoFormatDate";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyTextInput from "@/components/MyTextInput";
import PhotoChooser from "@/components/PhotoChooser";
import { Child } from "@/components/storage/interfaces";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import ValidatedDateInput from "@/components/ValidDateInput";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { File, Paths } from 'expo-file-system';
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import uuid from "react-native-uuid";

export default function ChildAdd() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { updateChild, setSelectedChildId, allChildren } = useChild();

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
        try {
          const sourceFile = new File(photoUri);
          const destinationFile = new File(Paths.document, `${childId}.jpg`);
          await sourceFile.copy(destinationFile);
          finalPhotoUri = destinationFile.uri;
        } catch (err) {
          console.error("Chyba při ukládání fotky:", err);
          finalPhotoUri = photoUri;
        }
      }
    }

    const newChildData: Child = {
      id: childId, // UUID
      name: name.trim(),
      sex: sex,
      birthDate: formatDateLocal(birthDate), // YYYY-MM-DD
      photo: finalPhotoUri,
      milestones: [],
      words: [],
      foodRecords: [],
      teethDates: {},
      teethRecords: [],
      sleepRecords: [],
      breastfeedingRecords: [],
      wh: [],
      currentModeSleep: null,
      currentModeFeed: null,
      diaryRecords: [],
    };

    try {
      
       // Přidání do RAM (ihned v UI), Uložení do AsyncStorage (přežije restart), Přidání do pending_updates 
      await updateChild(newChildData);

      // Nastavíme jako aktivní dítě
      await setSelectedChildId(childId);

      router.back();
    } catch (error) {
      console.error("Kritická chyba při přidávání:", error);
      alert("Nepodařilo se uložit data.");
    }
  };

  return (
    <MainScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
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