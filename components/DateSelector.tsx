import { COLORS } from "@/constants/MyColors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";

type Props = {
  date: string | Date;
  onChange: (date: Date) => void;
  birthISO?: string | null;
};

export default function DateSelector({ date, onChange, birthISO }: Props) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(date);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      setTempDate(date);
    }
  }, [date]);

  const safeDate =
    date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const safeTempDate =
    tempDate instanceof Date && !isNaN(tempDate.getTime())
      ? tempDate
      : safeDate;

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.iconButton} 
        onPress={() => setShow(true)}>
        <Calendar size={20} color="#fff" />
      </Pressable>

       <Modal visible={show} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#222" : "#fff" }]}>
            <DateTimePicker
              value={safeTempDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  // PRO ANDROID: Schováme picker a hned uložíme (standardní chování)
                  if (Platform.OS === "android") {
                    setShow(false);
                    setTempDate(selectedDate);
                    onChange(selectedDate); // Tady je to pro Android OK
                  } else {
                    // PRO IOS: Jen aktualizujeme vnitřní stav modálu, neukládáme na backend!
                    setTempDate(selectedDate);
                  }
                } else if (Platform.OS === "android") {
                  setShow(false);
                }
              }}
            themeVariant={isDark ? "dark" : "light"}
            style={{ width: "100%" }}
            maximumDate={new Date()}
            minimumDate={birthISO && !isNaN(new Date(birthISO).getTime())
              ? new Date(birthISO) 
              : new Date(1950, 0, 1)}
            />
            <View style={styles.buttonRow}>
              <Pressable onPress={() => setShow(false)} style={styles.cancelButton}>
                <Text style={[styles.buttonText, { color: isDark ? "#fff" : "#000" }]}>Zrušit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(safeTempDate); 
                  setShow(false);
                }}
                style={styles.confirmButton}
              >
                <Text style={[styles.buttonText, { color: isDark ? "#fff" : "#000" }]}>Potvrdit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  iconButton: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
		width: 40,
		height: 35,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContent: {
    marginHorizontal: 30,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#ccc",
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.secundary,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
  },
});