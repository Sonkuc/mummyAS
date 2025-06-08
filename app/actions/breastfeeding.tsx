import BackButton from "@/components/BackButton";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import React from "react";

export default function Breastfeeding() {
  return (
    <MainScreenContainer>
      <BackButton targetPath=".."/>
      <Title>Záznamy o kojení</Title>
     </MainScreenContainer>
  );
}