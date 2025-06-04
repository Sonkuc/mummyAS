import { useRouter } from "expo-router";
import {
  Apple, Baby, Calendar, Heart, MessageCircle, Moon, Ruler, Star
} from "lucide-react-native";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BackButton from "../components/BackButton";
import MyButton from "../components/MyButton";
import Title from "../components/Title";
import { useChild } from "../contexts/ChildContext";

type Action = {
  title: string;
  route: string;
  icon: React.ReactNode;
};

export default function Actions() {
  const router = useRouter();
  const { selectedChild, selectedChildIndex } = useChild();

  const actions: Action[] = [
  { title: "Spánek", route: "/spanek", icon: <Moon color="white" size={20} /> },
  { title: "Kojení", route: "/kojeni", icon: <Heart color="white" size={20} /> },
  { title: "Výška/váha", route: "/vaha-vyska", icon: <Ruler color="white" size={20} /> },
  { title: "Pokroky", route: "/pokroky", icon: <Star color="white" size={20} /> },
  { title: "Zoubky", route: "/zoubky", icon: <Baby color="white" size={20} /> },
  { title: "Mluvení", route: "/mluva", icon: <MessageCircle color="white" size={20} /> },
  { title: "Potraviny", route: "/potraviny", icon: <Apple color="white" size={20} /> },
  { title: "Kalendář", route: "/kalendar", icon: <Calendar color="white" size={20} /> },
];

  return (
    <ScrollView style={styles.container}>
      <Pressable 
        style={styles.avatarContainer}
        onPress={() => {
          if (selectedChildIndex !== null) {
            router.push({ 
              pathname: "/modify-child", 
              params: { index: selectedChildIndex.toString()} 
              });
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
      <BackButton/>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff0f5",
    padding: 20,
    position: "relative",
  },
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