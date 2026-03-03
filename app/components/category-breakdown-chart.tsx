"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenses } from "@/lib/hooks/use-expenses";
import {
  aggregateByMainCategory,
  filterExpensesByDateRange,
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

export function CategoryBreakdownChart() {
  const { data: expenses = [], isLoading } = useExpenses();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending by category</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const { start, end } = getThisMonthRange();
  const thisMonthExpenses = filterExpensesByDateRange(expenses, start, end);
  const categoryData = aggregateByMainCategory(thisMonthExpenses);

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending by category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20">
            <p className="text-muted-foreground text-sm">
              No expenses this month to display.
            </p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Spending by category</CardTitle>
        <p className="text-muted-foreground text-xs">
          This month&apos;s breakdown
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Tooltip content={<ChartTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
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
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categoryData.slice(0, 6).map((item, i) => (
            <div
              key={item.category}
              className="flex min-w-0 items-center gap-2 text-sm"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              <span className="min-w-0 flex-1 wrap-break-word text-muted-foreground">
                {item.category}
              </span>
              <span className="shrink-0 font-medium">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
