import EditPencil from "@/components/EditPencil";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import { getParentRole } from "@/components/HelperFunctions";
import { getPhotoSource } from "@/components/PhotoFunctions";
import { COLORS } from "@/constants/MyColors";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/contexts/ChildContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Heart, LogOut, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();
  const { allChildren, setSelectedChildId, isDataLoaded } = useChild();
  const { user, isGuest, exitGuest } = useAuth(); 
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const parentRole = getParentRole(user?.user_metadata);

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    if (isGuest) {
      // Ukončení zkušebního režimu – data v paměti se zahodí
      router.replace("/auth/login");
      exitGuest();
      return;
    }
    await supabase.auth.signOut();
  };

  const handleGuestRegister = () => {
    setLogoutModalVisible(false);
    router.replace("/auth/register");
    exitGuest();
  };
  
  const getCardColor = (gender: string) =>
    gender === "chlapec" ? COLORS.boyCard :
    gender === "divka"   ? COLORS.girlCard :
    "lightgray";

  const getIconColor = (gender: string) =>
    gender === "chlapec" ? COLORS.boyIcon :       
    gender === "divka"   ? COLORS.girlIcon :      
    "gray";   
  
  if (!isDataLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
      </View>
    );
  }
    return (
    <MainScreenContainer scrollable contentContainerStyle={{ alignItems: "center" }}>
      <Pressable 
        onPress={() => setLogoutModalVisible(true)}
        style={styles.userIconWrapper}
      >
        <UserRound color={COLORS.primary} size={28} />
      </Pressable>

      <View style={{ justifyContent: "center", alignItems: "center", marginTop: 60, marginBottom: 30}}>
        <Text style={styles.title}>
          {parentRole === "maminka" ? "Milá maminko," : "Milý tatínku,"}
        </Text>
        <View style={styles.row}>
          <Text style={styles.subtitle}>vítej </Text>
          <Heart color={COLORS.primary} size={28} />
        </View>
        <Image source={require("@/assets/images/logo2.png")} style={styles.logo} />
        </View>
      {isGuest && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestBannerText}>Zkušební režim, data se neukládají</Text>
          <Pressable onPress={handleGuestRegister}>
            <Text style={styles.guestBannerLink}>Zaregistrovat se</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.bottom}>
        <MyButton title="Přidat dítko" onPress={() => router.push("/child-add")}/>  
      </View>
      {allChildren.length === 0 ? (
        <Text style={styles.subtitle}>Zatím nebylo přidáno žádné dítě.</Text>
      ) : (
        allChildren.map((kid, idx) => (
          <Pressable 
            onPress={async () => {
              await setSelectedChildId(kid.id);
              router.push("/actions");
            }} 
            key={kid.id}
            style={[
              styles.childCard, 
              { backgroundColor: getCardColor(kid.sex)},
            ]}>
            <View style={styles.row}>
              {kid.photo && (
                <Image
                  source={getPhotoSource(kid.photo)}
                  style={styles.childImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.name}>{kid.name}</Text>
            </View>
            <EditPencil
              color={getIconColor(kid.sex)}
              onPress={async () => {
                await setSelectedChildId(kid.id);
                router.push({
                  pathname: "/child-edit",
                  params: { id: kid.id }
                });
              }}
            />
          </Pressable>
        ))
      )}

      {/* --- MODAL PRO ODHLÁŠENÍ --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setLogoutModalVisible(false)}
        >
          <View style={styles.logoutModalContent}>
            {!isGuest && (
            <View style={styles.absoluteEdit}>
          <EditPencil
            color={COLORS.primary}
            onPress={() => {
              setLogoutModalVisible(false);
              
              router.push({
                pathname: "/profile-edit",
                params: { userId: user?.id }
              });
            }}
          />
        </View>
            )}

        <Text style={styles.logoutTitle}>{isGuest ? "Zkušební režim" : "Uživatel"}</Text>
        <Text style={styles.userEmail}>
          {isGuest ? "Data se neukládají a po odchodu zmizí." : user?.email}
        </Text>
        {isGuest && (
          <MyButton title="Zaregistrovat se" onPress={handleGuestRegister} />
        )}
            
            <View style={styles.divider} />

            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <LogOut color={"#ff4444"} size={20} />
              <Text style={styles.logoutText}>{isGuest ? "Ukončit zkušební režim" : "Odhlásit se"}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 35,
    color: COLORS.primary,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 27,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  bottom: {
    width: "100%",
    padding: 30,
    backgroundColor: "#fff0f5",
  },
  logo: {
    width: 350,
    height: 180,
    marginTop: 30,
  },
  childCard: {
    padding: 5,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: "#aaa",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    width: '80%',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontWeight: "bold",
    fontSize: 18,
  },
  childImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  userIconWrapper: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.primary,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  logoutText: {
    color: 'red',
    fontSize: 16,
    fontWeight: '600',
  },
  guestBanner: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
  },
  guestBannerText: {
    color: "#666",
    fontSize: 14,
  },
  guestBannerLink: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  absoluteEdit: {
    position: 'absolute',
    top: 15,
    right: 15,
},
});
