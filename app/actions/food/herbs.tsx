import FoodCategoryScreen from "@/components/FoodCategoryScreen.tsx";
import { HERBS } from "@/data/food/herbs";

export default function Herbs() {
  return (
    <FoodCategoryScreen 
      title="Bylinky"
      categoryKey="herbs"
      dataList={HERBS}
    />
  );
}