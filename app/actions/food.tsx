import BackButton from "@/components/BackButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import React from "react";

export default function Food() {
  return (
    <MainScreenContainer>
      <BackButton targetPath=".." />
      <Title>Jídlo</Title>
    </MainScreenContainer>
  );
}