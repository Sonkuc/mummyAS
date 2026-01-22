import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TextInput } from "react-native";
import { validateDate } from "./ValidateDate";

type Props = {
  value: string;
  onChange: (date: string | null) => void;
  birthISO?: string | null;
  allowPastDates?: boolean;
  placeholder?: string;
  fallbackOnError?: "today" | "original";
  originalValue?: string;
};

export default function ValidatedDateInput({ value, onChange, ...props }: Props) {
  const [internal, setInternal] = useState(value);

  // KLÍČOVÉ: Synchronizace, když se datum změní v DateSelectoru
  useEffect(() => {
    if (value && value !== internal) {
      setInternal(value);
    }
  }, [value]);

  const handleDateInput = (txt: string) => {
    let t = txt.replace(/[^\d]/g, "");
    if (t.length > 8) t = t.slice(0, 8);

    let formatted = t;
    if (t.length > 4) formatted = t.slice(0, 4) + "-" + t.slice(4);
    if (t.length > 6) formatted = formatted.slice(0, 7) + "-" + t.slice(6);

    setInternal(formatted);
    
    // Validní ISO má přesně 10 znaků (YYYY-MM-DD)
    if (formatted.length === 10) {
      onChange(formatted);
    }
  };

  const handleBlur = () => {
    const error = validateDate(internal, props.birthISO ?? null, props.allowPastDates);
    if (error) {
      Alert.alert("Chybné datum", error);
      // Fallback logika
      const fallback = (props.fallbackOnError === "original" && props.originalValue) 
        ? props.originalValue 
        : new Date().toISOString().slice(0, 10);
      
      setInternal(fallback);
      onChange(fallback);
    }
  };

  return (
    <TextInput
      style={styles.input}
      value={internal}
      onChangeText={handleDateInput}
      onBlur={handleBlur}
      keyboardType="numeric"
    />
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
