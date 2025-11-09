import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { validateDate } from "./DateUtils";

type Props = {
  value: string;
  onChange: (date: string | null) => void;
  birthISO?: string | null;
  allowPastDates?: boolean;
  placeholder?: string;
  fallbackOnError?: "today" | "original";
  originalValue?: string;
};

export default function ValidatedDateInput({
  value,
  onChange,
  birthISO,
  allowPastDates = false,
  placeholder = "YYYY-MM-DD",
  fallbackOnError = "today",
  originalValue,
}: Props) {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  const handleDateInput = (txt: string) => {
    let t = txt.replace(/[^\d]/g, "");
    if (t.length > 8) t = t.slice(0, 8);

    if (t.length > 4) t = t.slice(0, 4) + "-" + t.slice(4);
    if (t.length > 7) t = t.slice(0, 7) + "-" + t.slice(7);

    setInternal(t); 
    onChange(t); 
  };

  const handleBlur = () => {
    const error = validateDate(internal, birthISO ?? null, allowPastDates);
    if (error) {
      Alert.alert("Chybné datum", error);

      let fallback: string;
      if (fallbackOnError === "original" && originalValue) {
        fallback = originalValue;
      } else {
        fallback = new Date().toISOString().slice(0, 10);
      }

      setInternal(fallback);
      onChange(fallback);
    }
  };

  return (
    <View>
      <TextInput
        style={styles.input}
        value={internal}
        onChangeText={handleDateInput}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: "#ccc",
    borderWidth: 1,
  },
});
