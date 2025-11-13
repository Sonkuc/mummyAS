import FoodCategoryScreen from "@/components/FoodCategoryScreen.tsx";
import { MEAT } from "@/data/food/meat";

export default function Meat() {
  return (
    <FoodCategoryScreen 
      title="Maso"
      categoryKey="meat"
      dataList={MEAT}
    />
  );
}