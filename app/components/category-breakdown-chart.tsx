"use client";

import { useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenses } from "@/lib/hooks/use-expenses";
import {
  aggregateByMainCategory,
  filterExpensesByDateRange,
  getLastMonthRange,
  getThisMonthRange,
} from "@/lib/utils/analytics";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--muted-foreground)",
  "var(--accent)",
  "var(--secondary)",
  "var(--ring)",
];

const formatCurrency = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(paise / 100);

/** Tooltip content: full category name + amount + percentage */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { percentage: number };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">
        {formatCurrency(value)} ({p.percentage.toFixed(0)}%)
      </p>
    </div>
  );
}

const PERIOD_OPTIONS = [
  { value: "this_month", label: "This month", getRange: getThisMonthRange },
  { value: "last_month", label: "Last month", getRange: getLastMonthRange },
] as const;

export function CategoryBreakdownChart() {
  const [period, setPeriod] = useState<"this_month" | "last_month">("this_month");
  const { data: expenses = [], isLoading } = useExpenses();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">By category</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const { getRange } = PERIOD_OPTIONS.find((p) => p.value === period) ?? PERIOD_OPTIONS[0];
  const { start, end } = getRange();
  const periodExpenses = filterExpensesByDateRange(expenses, start, end);
  const categoryData = aggregateByMainCategory(periodExpenses);

  if (categoryData.length === 0) {
    const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? "selected period";
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">By category</CardTitle>
            <p className="text-muted-foreground text-xs">{periodLabel} breakdown</p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as "this_month" | "last_month")}>
            <SelectTrigger size="sm" className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10">
            <p className="text-muted-foreground text-sm">No expenses in {periodLabel.toLowerCase()}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = categoryData.map((item, index) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? "Period";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">By category</CardTitle>
          <p className="text-muted-foreground text-xs">{periodLabel} breakdown</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as "this_month" | "last_month")}>
          <SelectTrigger size="sm" className="h-8 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Tooltip content={<ChartTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ percent }) =>
                  (percent ?? 0) * 100 >= 5
                    ? `${((percent ?? 0) * 100).toFixed(0)}%`
                    : ""
                }
                labelLine={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {categoryData.slice(0, 6).map((item, i) => (
            <div
              key={item.category}
              className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/50"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {item.category}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
