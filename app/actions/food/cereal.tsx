import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import React from "react";

export default function Sleep() {
  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/food"/>
      <Title>Přílohy</Title>
    </MainScreenContainer>
  );
}