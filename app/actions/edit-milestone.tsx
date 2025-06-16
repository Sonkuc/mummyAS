import BackButton from "@/components/BackButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function EditMilestone() {
  const { index } = useLocalSearchParams();

  return (
    <MainScreenContainer>
      <BackButton targetPath=".."/>
      <Title>Uprav milník</Title>
    </MainScreenContainer>
  );
}