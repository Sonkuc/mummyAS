import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import MyButton from "@/components/MyButton";
import Title from "@/components/Title";
import { useChild } from "@/contexts/ChildContext";
import { useRouter } from "expo-router";
import {
  Apple, Baby, Calendar, Heart, MessageCircle, Moon, Ruler, Star
} from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Action = {
  title: string;
  route: string;
  icon: React.ReactNode;
};

export default function Actions() {
  const router = useRouter();
  const { selectedChild, selectedChildIndex } = useChild();

  const actions: Action[] = [
  { title: "Spánek", route: "/actions/sleep", icon: <Moon color="white" size={20} /> },
  { title: "Kojení", route: "/actions/breastfeeding", icon: <Heart color="white" size={20} /> },
  { title: "Výška/váha", route: "/actions/weight-height", icon: <Ruler color="white" size={20} /> },
  { title: "Milníky", route: "/actions/milestone", icon: <Star color="white" size={20} /> },
  { title: "Zoubky", route: "/actions/teeth", icon: <Baby color="white" size={20} /> },
  { title: "Mluvení", route: "/actions/speaking", icon: <MessageCircle color="white" size={20} /> },
  { title: "Potraviny", route: "/actions/food", icon: <Apple color="white" size={20} /> },
  { title: "Kalendář", route: "/actions/calendar", icon: <Calendar color="white" size={20} /> },
];

  return (
    <MainScreenContainer contentContainerStyle={{position: "relative"}}>
      <CustomHeader backTargetPath="/">
        <Pressable 
        style={styles.avatarContainer}
        hitSlop={20} 
        onPress={() => {
          if (selectedChildIndex !== null) {
            router.push("../child-edit");
          }
        }}>
        {selectedChild?.photo ? (
          <>
            <Image source={{ uri: selectedChild.photo }} 
            style={styles.avatar} 
            resizeMode="cover"/>
            <View style={styles.avatarInitialOverlay}>
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
    </MainScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
    gap: 1,
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
    backgroundColor: "rgb(164, 91, 143)",
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
    backgroundColor: "#a45b8f",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitialText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});