import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Pressable, Text } from "react-native";

type Props = {
  time: string; // HH:MM format
  onChange: (time: string) => void;
};

export default function TimeSelector({ time, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const formatted = formatTime(selectedDate);
      onChange(formatted);
    }
    setShowPicker(false);
  };

  return (
    <>
      <Pressable onPress={() => setShowPicker(true)}>
        <Text style={{ fontSize: 20, color: "#0066cc" }}>🕐</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={parseTime(time)}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
        />
      )}
    </>
  );
}