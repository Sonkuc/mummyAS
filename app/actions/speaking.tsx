import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import React from "react";

export default function Speaking() {
  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions"/>
      <Title>Mluvení</Title>
    </MainScreenContainer>
  );
}