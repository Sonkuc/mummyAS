import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const finishLogin = async () => {
      // Supabase automaticky zpracuje tokeny z URL
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.log("Auth callback error:", error);
        router.replace("/auth/login");
        return;
      }

      if (session) {
        router.replace("/home");
      }
    };

    finishLogin();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}