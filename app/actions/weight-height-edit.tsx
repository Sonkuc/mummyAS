import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import React from "react";

export default function Whe() {
  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions"/>
      <Title>Upravit</Title>
    </MainScreenContainer>
  );
}