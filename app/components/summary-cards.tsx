"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenses } from "@/lib/hooks/use-expenses";
import {
  filterExpensesByDateRange,
  getLastMonthRange,
  getLastWeekRange,
  getThisMonthRange,
  getThisWeekRange,
  sumPaise,
} from "@/lib/utils/analytics";

const PAISE_PER_RUPEE = 100;

const formatCurrency = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(paise / PAISE_PER_RUPEE);

function getTrendColor(trend: "up" | "down" | "neutral" | undefined): string {
  if (trend === "up") return "text-destructive";
  if (trend === "down") return "text-emerald-600 dark:text-emerald-500";
  return "text-muted-foreground";
}

function SummaryCard({
  title,
  amount,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  amount: number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {title}
          </span>
          <Icon className="text-muted-foreground size-4" />
        </div>
        <p className="text-2xl font-semibold tracking-tight">
          {formatCurrency(amount)}
        </p>
        {subtitle && (
          <div className="flex items-center gap-1.5 text-xs">
            {trend === "up" && (
              <ArrowUpRight className="text-destructive size-3.5" />
            )}
            {trend === "down" && (
              <ArrowDownRight className="text-emerald-600 dark:text-emerald-500 size-3.5" />
            )}
            <span className={getTrendColor(trend)}>{subtitle}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SummaryCards() {
  const { data: expenses = [], isLoading } = useExpenses();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["summary-1", "summary-2", "summary-3", "summary-4"].map((id) => (
          <Card key={id}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { start: thisWeekStart, end: thisWeekEnd } = getThisWeekRange();
  const { start: lastWeekStart, end: lastWeekEnd } = getLastWeekRange();
  const { start: thisMonthStart, end: thisMonthEnd } = getThisMonthRange();
  const { start: lastMonthStart, end: lastMonthEnd } = getLastMonthRange();

  const thisWeek = filterExpensesByDateRange(
    expenses,
    thisWeekStart,
    thisWeekEnd,
  );
  const lastWeek = filterExpensesByDateRange(
    expenses,
    lastWeekStart,
    lastWeekEnd,
  );
  const thisMonth = filterExpensesByDateRange(
    expenses,
    thisMonthStart,
    thisMonthEnd,
  );
  const lastMonth = filterExpensesByDateRange(
    expenses,
    lastMonthStart,
    lastMonthEnd,
  );

  const thisWeekTotal = sumPaise(thisWeek);
  const lastWeekTotal = sumPaise(lastWeek);
  const thisMonthTotal = sumPaise(thisMonth);
  const lastMonthTotal = sumPaise(lastMonth);

  const weekDiff =
    lastWeekTotal > 0
      ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
      : null;
  const monthDiff =
    lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : null;

  const getTrend = (diff: number | null): "up" | "down" | "neutral" => {
    if (diff === null) return "neutral";
    if (diff > 0) return "up";
    if (diff < 0) return "down";
    return "neutral";
  };
  const weekTrend = getTrend(weekDiff);
  const monthTrend = getTrend(monthDiff);

  const weekSubtitle =
    weekDiff !== null
      ? `${Math.abs(weekDiff).toFixed(1)}% vs last week`
      : undefined;
  const monthSubtitle =
    monthDiff !== null
      ? `${Math.abs(monthDiff).toFixed(1)}% vs last month`
      : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="This week"
        amount={thisWeekTotal}
        subtitle={weekSubtitle}
        icon={Calendar}
        trend={weekTrend}
      />
      <SummaryCard
        title="This month"
        amount={thisMonthTotal}
        subtitle={monthSubtitle}
        icon={CalendarDays}
        trend={monthTrend}
      />
      <SummaryCard title="Last week" amount={lastWeekTotal} icon={TrendingUp} />
      <SummaryCard
        title="Last month"
        amount={lastMonthTotal}
        icon={TrendingUp}
      />
    </div>
  );
}
