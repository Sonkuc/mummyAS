import { COLORS } from "@/constants/MyColors";
import { Search } from "lucide-react-native";
import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Item = { label: string; buttonStyle?: any } | string;

type Props = {
  list: Item[];
  onSelect?: (item: string) => void;
  getButtonStyle?: (item: Item) => any;
};

export default function LookUp({ list = [], onSelect, getButtonStyle }: Props) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [query, setQuery] = useState("");
  
  const handlePress = () => {
    setIsSearchVisible(!isSearchVisible);
    setQuery(""); // resetuje hledání při každém otevření
  };

  const getLabel = (item: Item) =>
    typeof item === "string" ? item : item.label;

  const filteredList = list.filter((item) =>
    getLabel(item).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handlePress}>
        <Search color="white" size={30} />
      </Pressable>

      {isSearchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Hledej ..."
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <FlatList nestedScrollEnabled
              data={filteredList}
              keyExtractor={(item, index) => `${getLabel(item)}-${index}`}
              renderItem={({ item }) => {
                const label = getLabel(item);
                const style = getButtonStyle ? getButtonStyle(item) : {};
                return (
                  <Pressable
                    style={[styles.resultButton, style]}
                    onPress={() => {
                      onSelect?.(label);
                      setIsSearchVisible(false);
                      setQuery("");
                    }}
                  >
                    <Text style={styles.resultButtonText}>{label}</Text>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 30,
    right: 10,
    zIndex: 10,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    position: "absolute",
    top: 60, // trochu níž pod tlačítko lupy
    right: 0,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#aaa",
    marginBottom: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  resultItem: {
    fontSize: 16,
    paddingVertical: 4,
    color: "#444",
  },
  resultButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    alignItems: "center",
  },
  resultButtonText: {
    fontSize: 16,
  },
});