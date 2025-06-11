import AddButton from "@/components/AddButton";
import BackButton from "@/components/BackButton";
import CustomHeader from "@/components/CustomHeader";
import MainScreenContainer from "@/components/MainScreenContainer";
import Title from "@/components/Title";
import { useRouter } from "expo-router";
import React from "react";

export default function Progress() {
  const router = useRouter();

  return (
    <MainScreenContainer>
      <CustomHeader>
        <BackButton/>
        <AddButton targetPath="/actions/add-milestone" />
      </CustomHeader>
      <Title>Milníky</Title>
    </MainScreenContainer>
  );
}
