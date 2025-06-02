import { useRouter } from "expo-router";
import {
  Apple, Baby, Calendar, Heart, MessageCircle, Moon, Ruler, Star
} from "lucide-react-native";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import BackButton from "../components/BackButton";
import MyButton from "../components/MyButton";
import Title from "../components/Title";
import { useChild } from "../contexts/ChildContext";

type Action = {
  title: string;
  route: string;
  icon: React.ReactNode;
};

export default function Akce() {
  const router = useRouter();
  const { selectedChild } = useChild();

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
      <View style={styles.avatarContainer}>
      {
        selectedChild?.photo ? (
          <Image source={selectedChild.photo} style={styles.avatar} />
        ) : (
          <View style={styles.initialCircle}>
            <Text style={styles.initial}>
              {selectedChild?.name?.charAt(0) || "?"}
            </Text>
          </View>
        )
      }
    </View>
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
  },
  buttonContainer: {
    marginTop: 20,
    gap: 1,
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  initialCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgb(164, 91, 143)",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: "white",
    fontWeight: "bold",
  },
});