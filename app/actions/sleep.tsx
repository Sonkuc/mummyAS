import BackButton from "@/components/BackButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import React from "react";

export default function Sleep() {
  return (
    <MainScreenContainer>
      <BackButton targetPath=".."/>
      <Title>Záznamy o spánku</Title>
    </MainScreenContainer>
  );
}