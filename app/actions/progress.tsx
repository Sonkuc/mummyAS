import React from "react";
import BackButton from "../../components/BackButton";
import MainScreenContainer from "../../components/MainScreenContainer";
import Title from "../../components/Title";

export default function Progress() {
  return (
    <MainScreenContainer>
      <BackButton targetPath=".."/>
      <Title>Milníky</Title>
    </MainScreenContainer>
  );
}