import { Dimensions, Text } from "react-native";
import { BarChart } from "react-native-chart-kit";

type Props = {
  title: string;
  data: { label: string; hours: number }[];
  mode: "week" | "month" | "halfYear";
};

export function MyBarChart({ title, data }: Props) {
  const screenWidth = Dimensions.get("window").width;

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
        yAxisInterval={2}
        segments={5}
        formatYLabel={(value: string) => {
          const hours = parseFloat(value);
          return `${Math.round(hours)}h`;
        }}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff0f5",
          backgroundGradientTo: "#fff0f5",
          decimalPlaces: 0,
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

