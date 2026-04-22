import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import MyTextInput from "@/components/MyTextInput";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Register() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sex, setSex] = useState("");

  const handleRegister = async () => {
    // 1. Základní validace
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert("Chyba", "Vyplňte prosím všechna pole.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Chyba", "Hesla se neshodují.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Chyba", "Heslo musí mít alespoň 6 znaků.");
      return;
    }

    if (!sex) {
      Alert.alert("Chyba", "Vyberte prosím, zda jste maminka nebo tatínek.");
      return;
    }

    setLoading(true);

    // 2. Volání Supabase registrace
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
      // Uloží do user_metadata
      data: {
        gender: sex, 
      },
    },
    });

    setLoading(false);

    if (error) {
      Alert.alert("Chyba registrace", error.message);
      return;
    }

    // 3. Informování uživatele (Supabase standardně posílá potvrzovací e-mail)
    if (data.session) {
      // Pokud je automatické potvrzení zapnuto, uživatel je rovnou přihlášen
      router.replace("/home");
    } else {
      Alert.alert(
        "Registrace úspěšná", 
        "Zkontrolujte svůj e-mail pro potvrzení účtu.",
        [{ text: "OK", onPress: () => router.replace("/auth/login") }]
      );
    }
  };

  return (
    <MainScreenContainer>
      <CustomHeader/>
      <ScrollView contentContainerStyle={styles.scrollContent} >
        <Title>Nový účet</Title>

        <View style={styles.form}>
          <Subtitle>E-mail</Subtitle>
          <MyTextInput
            placeholder="vas@email.cz"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Subtitle style={styles.labelSpacing}>Heslo</Subtitle>
          <MyTextInput
            placeholder="Minimálně 6 znaků"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Subtitle style={styles.labelSpacing}>Potvrzení hesla</Subtitle>
          <MyTextInput
            placeholder="Zadejte heslo znovu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Subtitle style={styles.labelSpacing}>Jsem</Subtitle>
          <View style={styles.genderContainer}>
            <Pressable
              style={[
                styles.genderButton,
                sex === "mum" && styles.genderSelected,
              ]}
              onPress={() => setSex("mum")}
            >
              <Text style={[
                styles.genderText,
                sex === "mum" && styles.genderTextSelected,
              ]}>Maminka</Text>
            </Pressable>

            <Pressable
              style={[
                styles.genderButton,
                sex === "dad" && styles.genderSelected,
              ]}
              onPress={() => setSex("dad")}
            >
              <Text style={[
                styles.genderText,
                sex === "dad" && styles.genderTextSelected,
              ]}>Tatínek</Text>
            </Pressable>
          </View>

          <View style={styles.buttonContainer}>
            <MyButton 
              title={loading ? "Registruji..." : "Vytvořit účet"} 
              onPress={handleRegister} 
              disabled={loading}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Již máte účet? </Text>
          <Text 
            style={styles.linkText} 
            onPress={() => router.push("/auth/login")}
          >
            Přihlaste se
          </Text>
        </View>
      </ScrollView>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  form: {
    marginTop: 20,
  },
  labelSpacing: {
    marginTop: 15,
  },
  buttonContainer: {
    marginTop: 30,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#666",
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  genderButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "48%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  genderSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  genderTextSelected: {
    color: "white",
  },
});