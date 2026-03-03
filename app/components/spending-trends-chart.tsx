"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, SearchIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenses } from "@/lib/hooks/use-expenses";
import {
  aggregateByMainCategory,
  aggregatePeriodsByCategory,
  filterExpensesByDateRange,
  filterExpensesBySearch,
  getDefaultRangeForView,
  getPeriodRangesInRange,
  sumPaise,
} from "@/lib/utils/analytics";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--accent)",
  "var(--muted-foreground)",
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

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDateRangeLabel(dateRange: DateRange | undefined): string {
  if (dateRange?.from == null) return "Date range";
  const fromStr = formatDateLabel(dateRange.from);
  if (dateRange.to == null) return fromStr;
  return `${fromStr} – ${formatDateLabel(dateRange.to)}`;
}

type TooltipPayload = {
  name: string;
  value: number;
  payload?: { percentage?: number };
}[];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  label?: string;
}) => {
  if (!active || !label) {
    return null;
  }
  const total = payload?.reduce((sum, p) => sum + p.value, 0) ?? 0;
  const single = payload?.length === 1 ? payload[0] : null;
  const pct = single?.payload?.percentage;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-md">
      <p className="text-muted-foreground text-xs">{label}</p>
      {payload &&
        payload.length > 0 &&
        (payload.length > 1 ? (
          <div>
            {payload
              .filter((p) => p.value > 0)
              .map((p) => (
                <p key={p.name} className="text-xs">
                  <span className="text-muted-foreground">{p.name}:</span>{" "}
                  {formatCurrency(p.value)}
                </p>
              ))}
            <p className="mt-1 font-semibold">Total: {formatCurrency(total)}</p>
          </div>
        ) : (
          <div>
            <p className="font-semibold">{formatCurrency(payload[0].value)}</p>
            {pct != null && (
              <p className="text-muted-foreground text-xs">
                {pct.toFixed(0)}% of total
              </p>
            )}
          </div>
        ))}
    </div>
  );
};

type DateRangeView = "daily" | "weekly" | "monthly";
type ChartMode = "date" | "category" | "combined";

export function SpendingTrendsChart() {
  const [mode, setMode] = useState<ChartMode>("date");
  const [view, setView] = useState<DateRangeView>("weekly");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const { data: expenses = [], isLoading } = useExpenses();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const { start: defaultStart, end: defaultEnd } = getDefaultRangeForView(view);
  const rangeStart = dateRange?.from ?? defaultStart;
  const rangeEnd = dateRange?.to ?? dateRange?.from ?? defaultEnd;

  const filteredByDate = filterExpensesByDateRange(
    expenses,
    rangeStart,
    rangeEnd,
  );
  const filteredExpenses = filterExpensesBySearch(filteredByDate, searchInput);

  const periodRanges = getPeriodRangesInRange(view, rangeStart, rangeEnd);
  const dateChartData = periodRanges.map((p) => {
    const inPeriod = filterExpensesByDateRange(
      filteredExpenses,
      p.start,
      p.end,
    );
    return {
      name: p.label,
      amount: sumPaise(inPeriod),
    };
  });

  const categoryData = aggregateByMainCategory(filteredExpenses);
  const combinedData = aggregatePeriodsByCategory(
    filteredExpenses,
    periodRanges,
  );
  const categoryKeys =
    combinedData.length > 0
      ? Object.keys(combinedData[0]).filter((k) => k !== "name")
      : [];

  const chartData = (() => {
    if (mode === "category")
      return categoryData.map((d) => ({ ...d, name: d.category }));
    if (mode === "combined") return combinedData;
    return dateChartData;
  })();

  const isEmpty =
    mode === "combined"
      ? combinedData.every((row) =>
          categoryKeys.every((k) => (row[k] ?? 0) === 0),
        )
      : chartData.every(
          (d) =>
            "amount" in d && typeof d.amount === "number" && d.amount === 0,
        );

  const hasActiveFilters =
    dateRange?.from != null || searchInput.trim().length > 0;

  const getSubtitle = () => {
    if (hasActiveFilters) return "Filtered view";
    if (mode === "category") return "This month by category";
    if (mode === "combined") return `${view} by category`;
    return view;
  };
  const subtitle = getSubtitle();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">Spending trends</CardTitle>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search by category or note..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                <CalendarIcon className="mr-2 size-4" />
                {getDateRangeLabel(dateRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateRange(undefined);
                setSearchInput("");
              }}
            >
              Clear filters
            </Button>
          )}
          <div className="flex gap-1">
            <Button
              variant={mode === "date" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("date")}
            >
              By date
            </Button>
            <Button
              variant={mode === "category" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("category")}
            >
              By category
            </Button>
            <Button
              variant={mode === "combined" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("combined")}
            >
              Combined
            </Button>
          </div>
          {(mode === "date" || mode === "combined") && (
            <div className="flex gap-1">
              <Button
                variant={view === "daily" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("daily")}
              >
                Daily
              </Button>
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
          )}
        </div>
        <div className="h-[280px]">
          {isEmpty ? (
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
                {mode === "combined" ? (
                  categoryKeys.map((cat, i) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="stack"
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      radius={
                        i === categoryKeys.length - 1
                          ? [4, 4, 0, 0]
                          : [0, 0, 0, 0]
                      }
                      maxBarSize={48}
                    />
                  ))
                ) : (
                  <Bar
                    dataKey="amount"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
