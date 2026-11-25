import { formatDateLocal } from "@/components/IsoFormatDate";
import { showAlert } from "@/components/showAlert";
import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
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

// Hodnota (value / onChange) je vždy ISO „YYYY-MM-DD“, uživateli se ale
// zobrazuje a píše v českém formátu „DD.MM.YYYY“.
const isoToCzech = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || "";
};
const czechToIso = (cz: string) => {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(cz);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : cz;
};

export default function ValidatedDateInput({ value, onChange, ...props }: Props) {
  const [internal, setInternal] = useState(isoToCzech(value));

  // KLÍČOVÉ: Synchronizace, když se datum změní v DateSelectoru
  useEffect(() => {
    if (value && value !== czechToIso(internal)) {
      setInternal(isoToCzech(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleDateInput = (txt: string) => {
    let t = txt.replace(/[^\d]/g, "");
    if (t.length > 8) t = t.slice(0, 8);

    // DDMMYYYY -> DD.MM.YYYY
    let formatted = t;
    if (t.length > 2) formatted = t.slice(0, 2) + "." + t.slice(2);
    if (t.length > 4) formatted = formatted.slice(0, 5) + "." + t.slice(4);

    setInternal(formatted);

    // Kompletní datum má přesně 10 znaků (DD.MM.YYYY)
    if (formatted.length === 10) {
      onChange(czechToIso(formatted));
    }
  };

  const handleBlur = () => {
    const error = validateDate(czechToIso(internal), props.birthISO ?? null, props.allowPastDates);
    if (error) {
      showAlert("Chybné datum", error);
      // Fallback logika
      const fallback = (props.fallbackOnError === "original" && props.originalValue) 
        ? props.originalValue 
        : formatDateLocal(new Date());
      
      setInternal(isoToCzech(fallback));
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
      placeholder={props.placeholder ?? "DD.MM.RRRR"}
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
