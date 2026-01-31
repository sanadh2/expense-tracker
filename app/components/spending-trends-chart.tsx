"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenses } from "@/lib/hooks/use-expenses";
import { aggregateMonthly, aggregateWeekly } from "@/lib/utils/analytics";

const formatCurrency = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(paise / 100);

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.[0] || !label) {
    return null;
  }
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-md">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export function SpendingTrendsChart() {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const { data: expenses = [], isLoading } = useExpenses();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending over time</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const weeklyData = aggregateWeekly(expenses, 8);
  const monthlyData = aggregateMonthly(expenses, 6);

  const chartData =
    view === "weekly"
      ? weeklyData.map((d) => ({ ...d, name: d.label }))
      : monthlyData.map((d) => ({ ...d, name: d.label }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Spending over time</CardTitle>
          <p className="text-muted-foreground text-xs">
            {view === "weekly" ? "Last 8 weeks" : "Last 6 months"}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant={view === "weekly" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={view === "monthly" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("monthly")}
          >
            Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {chartData.every((d) => d.amount === 0) ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20">
              <p className="text-muted-foreground text-sm">
                No spending data to display.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    const rupees = v / 100;
                    return rupees >= 1000
                      ? `₹${(rupees / 1000).toFixed(1)}K`
                      : `₹${rupees}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="amount"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
