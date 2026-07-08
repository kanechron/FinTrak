import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { type Budget } from "../../api/budgets";

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #1f2937",
  borderRadius: 8,
};
const tooltipTextStyle = { color: "#e5e7eb" };
const axisStyle = { fill: "#6b7280", fontSize: 11 };

interface Props {
  data: Budget[];
}

export default function BudgetPerformanceChart({ data }: Props) {
  const chartData = data.map((b) => ({
    name: b.name,
    Spent: Number(b.spent.toFixed(2)),
    Remaining: Number(Math.max(0, b.amount - b.spent).toFixed(2)),
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-center text-gray-500 text-sm py-12">
        No budgets found
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={192}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="name" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(v: unknown) => `$${(v as number).toFixed(2)}`}
          contentStyle={tooltipStyle}
          labelStyle={tooltipTextStyle}
          itemStyle={tooltipTextStyle}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
        <Bar dataKey="Spent" stackId="budget" fill="#f472b6" />
        <Bar
          dataKey="Remaining"
          stackId="budget"
          fill="#818cf8"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
