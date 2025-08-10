import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import TimestampRecorder from "@/components/WriteTime";
import React from "react";
import { Image, StyleSheet } from "react-native";
import {Eye, Eye-closed} from "lucide-react-native";

export default function Sleep() {
  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions" />
      <Title>Záznamy o spánku</Title>
      <TimestampRecorder />
    </MainScreenContainer>
  );
}

