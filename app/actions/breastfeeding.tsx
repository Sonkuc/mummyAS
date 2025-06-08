import React from "react";
import BackButton from "../../components/BackButton";
import MainScreenContainer from "../../components/MainScreenContainer";
import Title from "../../components/Title";

export default function Breastfeeding() {
  return (
    <MainScreenContainer>
      <BackButton targetPath=".."/>
      <Title>Záznamy o kojení</Title>
     </MainScreenContainer>
  );
}