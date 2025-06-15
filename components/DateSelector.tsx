import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  date: Date;
  onChange: (date: Date) => void;
};

export default function DateSelector({ date, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(date);

  return (
    <View style={styles.wrapper}>
      
      <Pressable style={styles.iconButton} onPress={() => setShow(true)}>
        <Calendar size={20} color="#fff" />
      </Pressable>

      <Modal visible={show} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) setTempDate(selectedDate);
              }}
              style={{ width: "100%" }}
            />
            <View style={styles.buttonRow}>
              <Pressable onPress={() => setShow(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Zrušit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(tempDate);
                  setShow(false);
                }}
                style={styles.confirmButton}
              >
                <Text style={styles.buttonText}>Potvrdit</Text>
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
    backgroundColor: "rgb(164, 91, 143)",
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
    backgroundColor: "white",
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
    backgroundColor: "rgb(164, 91, 143)",
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },
});