import FoodCategoryScreen from "@/components/FoodCategoryScreen";
import { OTHER } from "@/data/food/other";

export default function Other() {
  return (
    <FoodCategoryScreen 
      title="Ostatní"
      categoryKey="other"
      dataList={OTHER}
    />
  );
}