import FoodCategoryScreen from "@/components/FoodCategoryScreen";
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