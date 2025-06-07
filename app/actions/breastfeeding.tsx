import BackButton from "../../components/BackButton";
import MainScreenContainer from "../../components/MainScreenContainer";
import Title from "../../components/Title";

export default function Breastfeeding() {

    return (
            <MainScreenContainer>
                <BackButton targetPath="/index-actions"/>
                <Title>Záznamy o kojení</Title>
            </MainScreenContainer>
    );
}