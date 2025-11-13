import FoodCategoryScreen from "@/components/FoodCategoryScreen.tsx";
import { CEREAL } from "@/data/food/cereal";

export default function Cereal() {
  return (
    <FoodCategoryScreen 
      title="Obiloviny"
      categoryKey="cereal"
      dataList={CEREAL}
    />
  );
}