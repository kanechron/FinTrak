import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface MonthlySpending {
  year: number;
  month: number;
  amount: number;
}

const selectClass =
  "bg-gray-900 border border-gray-700 rounded-md text-xs text-gray-400 px-2 py-1 focus:outline-none focus:border-gray-500";
const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #1f2937",
  borderRadius: 8,
};
const tooltipTextStyle = { color: "#e5e7eb" };
const axisStyle = { fill: "#6b7280", fontSize: 11 };

function formatMonth(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

interface Props {
  data: MonthlySpending[];
}

export default function MonthlySpendingChart({ data }: Props) {
  const [chartType, setChartType] = useState("Line");

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonth(d.year, d.month),
  }));

  return (
    <section className="border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Monthly Spending Trend</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total spend over selected period
          </p>
        </div>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className={selectClass}
        >
          <option>Line</option>
          <option>Area</option>
          <option>Bar</option>
        </select>
      </div>
      {chartData.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-12">
          No data for selected period
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          {chartType === "Bar" ? (
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: unknown) => `$${(v as number).toFixed(2)}`}
                contentStyle={tooltipStyle}
                labelStyle={tooltipTextStyle}
                itemStyle={tooltipTextStyle}
              />
              <Bar dataKey="amount" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === "Area" ? (
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: unknown) => `$${(v as number).toFixed(2)}`}
                contentStyle={tooltipStyle}
                labelStyle={tooltipTextStyle}
                itemStyle={tooltipTextStyle}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#818cf8"
                fill="#818cf8"
                fillOpacity={0.15}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={axisStyle} />
              <YAxis tick={axisStyle} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: unknown) => `$${(v as number).toFixed(2)}`}
                contentStyle={tooltipStyle}
                labelStyle={tooltipTextStyle}
                itemStyle={tooltipTextStyle}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#818cf8"
                strokeWidth={2}
                dot={{ fill: "#818cf8", r: 3 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </section>
  );
}
