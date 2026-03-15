import { COLORS } from "@/constants/MyColors";
import { Check, NotebookPen, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface NoteProps {
  initialText?: string;
  onSave: (text: string) => void;
}

export default function Note({ initialText, onSave }: NoteProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [text, setText] = useState("");

  // Při otevření modalu načteme text z props
  useEffect(() => {
    if (modalVisible) {
      setText(initialText ?? "");
    }
  }, [modalVisible, initialText]);

  const handleSave = () => {
    onSave(text); // Pošleme text zpět rodiči
    setModalVisible(false);
  };

  return (
    <View>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.iconButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {/* Ikonka se změní na plnou, pokud poznámka existuje (UX detail) */}
        <NotebookPen 
            color={initialText ? COLORS.primary : "#ccc"} 
            size={18} 
        />
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Poznámka k záznamu</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X color="#333" size={24} />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              multiline
              placeholder="Např. pil jen z levého, u kojení usnul..."
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
              autoFocus
            />

            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Check color="white" size={20} />
              <Text style={styles.saveButtonText}>Uložit</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 4,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    height: 120,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: COLORS.primary || "#993769",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});