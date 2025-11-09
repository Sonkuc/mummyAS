import { COLORS } from "@/constants/MyColors";
import { Dimensions, Text } from "react-native";
import { BarChart } from "react-native-chart-kit";

type Props = {
  title: string;
  data: { label: string; hours: number }[];
  mode: "week" | "month" | "halfYear";
  dayMode?: "day" | "plusNight";
};

export function MyBarChart({ title, data, dayMode = "day" }: Props) {
  const screenWidth = Dimensions.get("window").width;

  const maxHours = Math.max(...data.map((d) => d.hours), 0);

  const segments =
    maxHours <= 6 ? 6 :
    maxHours <= 12 ? 8 :
    maxHours <= 18 ? 9 : 10;

  return (
    <>
      <Text style={{ textAlign: "center", marginBottom: 20, marginTop: 20 }}>
        {title}
      </Text>
      <BarChart
        data={{
          labels: data.map((d) => d.label),
          datasets: [{ data: data.map((d) => d.hours) }],
        }}
        width={screenWidth - 20}
        height={300}
        fromZero
        yAxisInterval={1}
        segments={segments}
        formatYLabel={(v: string) => {
          const num = parseFloat(v);
          if (isNaN(num)) return "";
          if (dayMode === "day") {
            // zobrazit s 1 desetinným místem
            return `${num.toFixed(1)}h`;
          } else {
            // zobrazit celé číslo
            return `${Math.round(num)}h`;
          }
        }}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: COLORS.backgroundContainer,
          backgroundGradientTo: COLORS.backgroundContainer,
          decimalPlaces: dayMode === "day" ? 1 : 0,
          color: (opacity = 1) => `rgba(153, 55, 105, ${opacity})`,
          labelColor: () => "#333",
          style: { borderRadius: 16 },
        }}
        style={{
          borderRadius: 16,
          alignSelf: "center",
          marginLeft: -40,
        }}
      />
    </>
  );
}

