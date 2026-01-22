import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import { getPhotoSource } from "@/components/PhotoFunctions";
import Subtitle from "@/components/Subtitle";
import Title from "@/components/Title";
import { COLORS } from "@/constants/MyColors";
import { useChild } from "@/contexts/ChildContext";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { Apple, Baby, Heart, MessageCircle, Moon, Ruler, Star } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Action = {
  title: string;
  route: Href;
  icon: React.ReactNode;
};

export default function Actions() {
  const router = useRouter();
  const { selectedChild, selectedChildId, reloadChildren } = useChild();  

  const sex = selectedChild?.sex || "";
  const [version, setVersion] = useState(0);

  const actions: Action[] = [
    { title: "Spánek", route: "/actions/sleep", icon: <Moon color="white" size={20} /> },
    { title: "Kojení", route: "/actions/breastfeeding", icon: <Heart color="white" size={20} /> },
    { title: "Růst", route: "/actions/weight-height", icon: <Ruler color="white" size={20} /> },
    { title: "Milníky", route: "/actions/milestone", icon: <Star color="white" size={20} /> },
    { title: "Zoubky", route: "/actions/teeth", icon: <Baby color="white" size={20} /> },
    { title: "Mluvení", route: "/actions/speaking", icon: <MessageCircle color="white" size={20} /> },
    { title: "Potraviny", route: "/actions/food", icon: <Apple color="white" size={20} /> },
  ];

  useFocusEffect(
    useCallback(() => {
      if (selectedChildId) {
        reloadChildren();
      }
    }, [selectedChildId])
  );

  // aby se aktualizovala fotka v inicialCircle
  useFocusEffect(
    useCallback(() => {
      setVersion(v => v + 1);
    }, [selectedChild?.photo])
  );

// Počet dní do příštích narozenin (0 = dnes, záporné hodnoty = už po)
  function getBirthdayMessage(birthDateISO?: string, childName?: string): string | null {
    if (!birthDateISO) return null;

    const birthDate = new Date(birthDateISO);
    const today = new Date();

    // Porovnávat jen datum (kvůli posunu časových pásem)
    today.setHours(0, 0, 0, 0);
    birthDate.setHours(0, 0, 0, 0);

    // letošní narozeniny
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

    // pokud už proběhly, přejdi na příští rok
    const nextBirthday =
      thisYearBirthday < today
        ? new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())
        : thisYearBirthday;

    const diffTime = nextBirthday.getTime() - today.getTime();
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const name = selectedChild?.name || "Dítě";

    if (days === 0) {
      return `${name} má dnes narozeniny! 🎉`;
    } else if (days === 1) {
      return `Do narozenin zbývá 1 den 🎂`;
    } else if (days >= 2 && days <= 4) {
      return `Do narozenin zbývají ${days} dny 🎈`;
    } else if (days <= 30) {
      return `Do narozenin zbývá ${days} dní 🎁`;
    } else {
      return null;
    }
  }
  
  const message = getBirthdayMessage(selectedChild?.birthDate);

  return (
    <MainScreenContainer contentContainerStyle={{ position: "relative" }}>
      <CustomHeader backTargetPath="/home">
        <Pressable
          style={styles.avatarContainer}
          hitSlop={20}
          onPress={() => {
            if (selectedChildId) {
              router.push({
                pathname: "/child-edit",
                params: { id: selectedChildId }
              });
            }
          }}
        >
          {selectedChild?.photo ? (
            <>
              <Image
                key={`${selectedChild?.photo}-${version}`}
                source={getPhotoSource(selectedChild?.photo)}
                style={styles.avatar}
              />
              <View
                style={[
                  styles.avatarInitialOverlay,
                  sex === "chlapec" ? styles.avatarInitialOverlayBoy : null,
                ]}
              >
                <Text style={styles.avatarInitialText}>
                  {selectedChild?.name?.charAt(0) || "?"}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.initialCircle}>
              <Text style={styles.initial}>
                {selectedChild?.name?.charAt(0) || "?"}
              </Text>
            </View>
          )}
        </Pressable>
      </CustomHeader>

      <Title>Vyber akci</Title>

      <View style={styles.buttonContainer}>
        {actions.map((action: Action, index) => (
          <MyButton
            key={index}
            title={action.title}
            onPress={() => router.push(action.route)}
            icon={action.icon}
          />
        ))}
      </View>
      <View>
        {message && (
          <Subtitle style={{ marginTop: 20, textAlign: "center", color: COLORS.primary }}>
            {message}
          </Subtitle>
        )}
      </View>
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  avatarContainer: {
    position: "absolute",
    top: 45,
    right: 25,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  initialCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: "white",
    fontWeight: "bold",
  },
  avatarInitialOverlay: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitialOverlayBoy: {
    backgroundColor: COLORS.boyIcon,
  },
  avatarInitialText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});