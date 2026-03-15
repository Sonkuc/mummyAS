import { COLORS } from "@/constants/MyColors";
import { Dimensions, Text } from "react-native";
import { BarChart as BarChartComponent } from "react-native-chart-kit";

type Props = {
  title: string;
  data: { label: string; hours: number }[];
  mode: "week" | "month" | "halfYear";
  dayMode?: "day" | "plusNight";
};

export function MyBarChart({ title, data, dayMode = "day" }: Props) {
  const screenWidth = Dimensions.get("window").width;
  const BarChart = BarChartComponent as any;

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
        segments={5}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: COLORS.backgroundContainer,
          backgroundGradientTo: COLORS.backgroundContainer,
          // decimalPlaces ovlivňuje, jak přesná čísla chodí do formatYLabel
          decimalPlaces: 2, 
          color: (opacity = 1) => `rgba(153, 55, 105, ${opacity})`,
          labelColor: () => "#333",
          style: { borderRadius: 16 },
          formatYLabel: (value: string) => {
            const totalHours = parseFloat(value);
            if (isNaN(totalHours) || totalHours === 0) return "0 h";

            const h = Math.floor(totalHours);
            const m = Math.round((totalHours - h) * 60);

            // Formátování
            if (m === 0) return `${h}h`;
            if (h === 0) return `${m}m`;
            return `${h}h ${m}m`;
          },
        }}
        style={{
          borderRadius: 16,
          alignSelf: "center",
          marginLeft: 20, 
        }}
      />
    </>
  );
}