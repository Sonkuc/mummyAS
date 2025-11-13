import FoodCategoryScreen from "@/components/FoodCategoryScreen.tsx";
import { FRUITS } from "@/data/food/fruit";

export default function Fruit() {
  return (
    <FoodCategoryScreen 
      title="Ovoce"
      categoryKey="fruit"
      dataList={FRUITS}
    />
  );
}