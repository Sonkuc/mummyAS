import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import MyTextInput from "@/components/MyTextInput";
import Subtitle from "@/components/Subtitle";
import { COLORS } from "@/constants/MyColors";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { Apple, Chrome, Facebook } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // přepis chybové zprávy
      if (error.message.includes("missing email or phone")) {
        alert("Prosím zadejte svůj e-mail a heslo");
      } else if (error.message.includes("Invalid login credentials")) {
        alert("Nesprávný e-mail nebo heslo");
      } else {
        alert(error.message); // ostatní chyby
      }
      return;
    }

    router.replace("/");
  };

  const handleGoogleLogin = async () => {
    console.log('Trying Google login...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'mummyas://auth/callback',
      },
    });

    if (error) {
      alert('Chyba při přihlášení přes Google: ' + error.message);
      return;
    }

    if (data?.url) {
      // otevře OAuth stránku v prohlížeči
      await WebBrowser.openBrowserAsync(data.url);
    }
  };


  return (
    <MainScreenContainer>
      <View style={{ alignItems: "center", marginTop: 70, marginBottom: 10}}>
        <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
      </View>
        <Subtitle>E-mail</Subtitle>
      <View>
        <MyTextInput
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
        />
        <Subtitle>Heslo</Subtitle>
        <MyTextInput
          placeholder="Heslo"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <View style={{}}>
        <MyButton title="Přihlásit" onPress={handleLogin}/>
      </View>
      <View style={{alignSelf: "center"}}>
        <Pressable style={styles.button} onPress={handleGoogleLogin}>
          <Chrome color="white" size={20} />
          <Text style={styles.oauthText}> Pokračovat s Google</Text>
        </Pressable>
        <Pressable style={styles.button}>
          <Apple color="white" size={20} />
          <Text style={styles.oauthText}> Pokračovat s Apple</Text>
        </Pressable>
        <Pressable style={styles.button}>
          <Facebook color="white" size={20} />
          <Text style={styles.oauthText}> Pokračovat s Facebookem</Text>
        </Pressable>
      </View>
      <View style={{marginTop: 60}}>
      <MyButton title="Prozatím přeskočit" onPress={() => router.push("/home")}/>
      </View>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 350,
    height: 180,
    marginTop: 30,
  },
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  oauthButtonDisabled: {
    backgroundColor: "#ddd",
  },
  oauthText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
