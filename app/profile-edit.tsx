import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import MyTextInput from "@/components/MyTextInput";
import * as api from "@/components/storage/api";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/contexts/ChildContext";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ProfileEdit() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [sex, setSex] = useState(user?.user_metadata?.parent_role || "");
  const [loading, setLoading] = useState(false);
  const { allChildren, deleteChild } = useChild();
  
  // Stavy pro hesla
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
  if (user?.user_metadata?.parent_role) {
    setSex(user.user_metadata.parent_role);
  }
}, [user]);

  const handleUpdateProfile = async () => {
    // 1. Validace hesel (pokud se uživatel snaží vyplnit nové heslo)
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        Alert.alert("Chyba", "Nové heslo musí mít alespoň 6 znaků.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Chyba", "Nová hesla se neshodují.");
        return;
      }
    }

    setLoading(true);
    
    // 2. Příprava dat pro update
    const updateData: any = {
      data: { parent_role: sex }
    };

    // Pokud uživatel vyplnil nové heslo, přidáme ho do updatu
    if (newPassword) {
      updateData.password = newPassword;
    }

    const { error } = await supabase.auth.updateUser(updateData);

    setLoading(false);

    if (error) {
      Alert.alert("Chyba", error.message);
    } else {
      Alert.alert("Úspěch", "Profil byl úspěšně aktualizován.");
      // Vyčistíme pole pro hesla
      setNewPassword("");
      setConfirmPassword("");
      setOldPassword("");
      router.back();
    }
  };

  const handleDeleteAccount = async () => {
    // 1. Kontrola připojení
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Alert.alert(
        "Jste offline", 
        "Pro smazání účtu musíte být připojeni k internetu, aby bylo možné data bezpečně odstranit i ze serveru."
      );
      return;
    }

    // 2. Potvrzovací okno
    Alert.alert(
      "⚠️ Trvalé smazání účtu",
      "Opravdu chcete smazat svůj profil a veškerá data o dětech? Tato akce je nevratná.",
      [
        { text: "Zrušit", style: "cancel" },
        { 
          text: "Smazat vše", 
          style: "destructive", 
          onPress: executeDelete 
        }
      ]
    );
  };

  const executeDelete = async () => {
  setLoading(true);
  try {
    if (!user) return;

    // A. Smazání z backendu (SQLite)
    await api.deleteUserProfile(user.id);
    console.log("Backend smazán");

    // B. VYČIŠTĚNÍ LOKÁLNÍCH DAT (Klíčový krok!)
    // Tady musíme zajistit, aby ChildContext zapomněl všechny děti
    // Pokud máš v useChild metodu pro reset, zavolej ji (např. setAllChildren([]))
    
    await AsyncStorage.clear(); 
    console.log("AsyncStorage vyčištěn");

    // C. Odhlášení
    await supabase.auth.signOut();

    // D. Navigace
    Alert.alert("Smazáno", "Účet byl smazán.");
    router.replace("/auth/login");
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/home" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title>Upravit profil</Title>

        <View style={styles.form}>
          {/* Vylepšené UI pro E-mail (needitovatelný) */}
          <Subtitle>Přihlašovací e-mail</Subtitle>
          <View style={styles.readOnlyInput}>
            <Text style={styles.readOnlyText}>{user?.email}</Text>
          </View>

          <View style={styles.divider} />

          <Subtitle>Změna hesla</Subtitle>
          <Text style={styles.infoText}>Pouze pokud chcete heslo změnit.</Text>
          
          <MyTextInput
            placeholder="Nové heslo (min. 6 znaků)"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <View style={{ marginTop: 10 }}>
            <MyTextInput
              placeholder="Potvrzení nového hesla"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <Subtitle style={styles.labelSpacing}>Jsem</Subtitle>
          <View style={styles.genderContainer}>
            <Pressable
              style={[styles.genderButton, sex === "maminka" && styles.genderSelected]}
              onPress={() => setSex("maminka")}
            >
              <Text style={[styles.genderText, sex === "maminka" && styles.genderTextSelected]}>
                Maminka
              </Text>
            </Pressable>

            <Pressable
              style={[styles.genderButton, sex === "tatinek" && styles.genderSelected]}
              onPress={() => setSex("tatinek")}
            >
              <Text style={[styles.genderText, sex === "tatinek" && styles.genderTextSelected]}>
                Tatínek
              </Text>
            </Pressable>
          </View>

          <View style={styles.buttonContainer}>
            <MyButton 
              title={loading ? "Ukládám..." : "Uložit změny"} 
              onPress={handleUpdateProfile} 
              disabled={loading}
            />
          </View>
        </View>
        <View style={[styles.buttonContainer, { marginTop: 40 }]}>
          <Pressable 
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              { opacity: pressed ? 0.6 : 1, alignItems: 'center', padding: 15 }
            ]}
          >
          <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Smazat účet</Text>
        </Pressable>
      </View>
      </ScrollView>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
  form: { marginTop: 10 },
  labelSpacing: { marginTop: 25, marginBottom: 10 },
  
  // Styly pro e-mail (read-only)
  readOnlyInput: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  readOnlyText: {
    color: "#777",
    fontSize: 16,
  },

  genderContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  genderButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "48%",
    alignItems: "center",
    backgroundColor: "white",
  },
  genderSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderText: { color: COLORS.primary, fontWeight: "600" },
  genderTextSelected: { color: "white" },
  
  buttonContainer: { marginTop: 30 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 20 },
  infoText: { color: "#888", fontSize: 13, marginBottom: 10 },
});