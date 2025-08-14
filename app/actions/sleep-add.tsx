import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import React from "react";

export default function SleepAdd() {
  return (
    <MainScreenContainer>
      <CustomHeader backTargetPath="/actions/sleep"/>
      <Title>SleepAdd</Title>
    </MainScreenContainer>
  );
}