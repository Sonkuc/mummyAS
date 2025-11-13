import FoodCategoryScreen from "@/components/FoodCategoryScreen.tsx";
import { LEGUME } from "@/data/food/legume";

export default function Legume() {
  return (
    <FoodCategoryScreen 
      title="Luštěniny"
      categoryKey="legume"
      dataList={LEGUME}
    />
  );
}