import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import MyTextInput from "@/components/MyTextInput";
import Subtitle from "@/components/Subtitle";
import { COLORS } from "@/constants/MyColors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import * as QueryParams from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { Chrome, HelpCircle, X } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);

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
    
    const redirectUri = QueryParams.makeRedirectUri({
      scheme: "mummyas",
      path: "auth/callback",
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

    if (res.type === "success" && res.url) {
    }
  };
  const handleResetPassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    setLoading(false);

    if (error) {
      Alert.alert("Chyba", error.message);
    } else {
      Alert.alert("E-mail odeslán", "Odkaz na reset hesla byl odeslán na váš e-mail.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <MainScreenContainer>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginTop: 50}}>
            <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
          </View>
          <View>
            <Subtitle>E-mail</Subtitle>
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
          <MyButton title="Přihlásit" onPress={handleLogin}/>
          <View style={{alignSelf: "center", marginTop: 20}}>
            <Pressable style={styles.button} onPress={() => router.push("/auth/register")}>
              <Text style={styles.oauthText}> Registrace</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleGoogleLogin}>
              <Chrome color="white" size={20} />
              <Text style={styles.oauthText}> Pokračovat s Google</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Pressable 
              style={styles.helpRow} 
              onPress={() => setResetModalVisible(true)}
            >
              <Text style={styles.footerText}>Zapomenuté údaje</Text>
              <HelpCircle color={COLORS.primary} size={22} />
            </Pressable>
          </View>
        </ScrollView>

        {/* --- MODAL PRO RESET HESLA --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={resetModalVisible}
          onRequestClose={() => setResetModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Obnova hesla</Text>
                <Pressable onPress={() => setResetModalVisible(false)}>
                  <X color="#333" size={24} />
                </Pressable>
              </View>

              <Text style={styles.modalDescription}>
                Odkaz na resetování hesla bude zaslán na e-mailovou adresu zadanou v přihlašovacím formuláři.
              </Text>

              <Text style={styles.targetEmail}>{email || "Email nezadán"}</Text>
              <MyButton 
                title={loading ? "Odesílám..." : "Poslat odkaz na e-mail"} 
                onPress={handleResetPassword}
                disabled={loading}
              />
            </View>
          </View>
        </Modal>
      </MainScreenContainer>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalDescription: {
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  targetEmail: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 16,
    color: "#666",
  },
});
