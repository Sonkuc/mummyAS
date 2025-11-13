import FoodCategoryScreen from "@/components/FoodCategoryScreen.tsx";
import { VEGETABLE } from "@/data/food/vegetable";

export default function Vegetable() {
  return (
    <FoodCategoryScreen 
      title="Zelenina"
      categoryKey="vegetable"
      dataList={VEGETABLE}
    />
  );
}