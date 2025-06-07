import BackButton from "../../components/BackButton";
import MainScreenContainer from "../../components/MainScreenContainer";
import Title from "../../components/Title";

export default function WeightHeight() {

    return (
            <MainScreenContainer>
                <BackButton targetPath="/index-actions"/>
                <Title>Měření</Title>
            </MainScreenContainer>
    );
}