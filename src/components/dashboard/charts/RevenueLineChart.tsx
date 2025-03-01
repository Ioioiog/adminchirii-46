
import { MonthlyRevenue } from "../types/revenue";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

interface RevenueLineChartProps {
  data: MonthlyRevenue[];
  gradientId: string;
  isPrediction?: boolean;
}

export function RevenueLineChart({ data, gradientId, isPrediction = false }: RevenueLineChartProps) {
  // Custom axis properties to avoid defaultProps warnings
  const xAxisProps = {
    dataKey: "month",
    scale: "auto", 
    type: "category" as const,
    allowDuplicatedCategory: true,
    className: "text-xs font-medium",
    tick: { fill: "hsl(var(--muted-foreground))" },
    axisLine: { stroke: "hsl(var(--border))" },
    tickLine: { stroke: "hsl(var(--border))" }
  };

  const yAxisProps = {
    scale: "auto",
    type: "number" as const,
    allowDecimals: true,
    className: "text-xs font-medium",
    tick: { fill: "hsl(var(--muted-foreground))" },
    tickFormatter: (value: number) => `$${value.toLocaleString()}`,
    axisLine: { stroke: "hsl(var(--border))" },
    tickLine: { stroke: "hsl(var(--border))" }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          className="stroke-muted/20"
          horizontal={true}
          vertical={false}
        />
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={(props) => <ChartTooltip {...props} isPrediction={isPrediction} />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          dot={false}
          activeDot={{
            r: 6,
            style: { fill: "hsl(var(--primary))", opacity: 1 }
          }}
          fill={`url(#${gradientId})`}
          isAnimationActive={true}
          animationDuration={1500}
          animationBegin={0}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
