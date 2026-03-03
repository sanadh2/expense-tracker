"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useExpenses } from "@/lib/hooks/use-expenses";
import { getWrappedStats, type WrappedStats } from "@/lib/utils/analytics";

const PAISE_PER_RUPEE = 100;

function formatCurrency(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(paise / PAISE_PER_RUPEE);
}

function Slide({
  children,
  className = "",
  background = "bg-primary/10",
}: {
  children: React.ReactNode;
  className?: string;
  background?: string;
}) {
  return (
    <div
      className={`flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 py-12 text-foreground ${background} ${className}`}
    >
      {children}
    </div>
  );
}

function SlideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-muted-foreground text-center text-sm font-medium uppercase tracking-[0.2em]">
      {children}
    </h2>
  );
}

function SlideValue({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl ${className}`}
    >
      {children}
    </p>
  );
}

export function WrappedView({ userName }: { userName: string }) {
  const { data: expenses = [], isLoading } = useExpenses();
  const [slideIndex, setSlideIndex] = useState(0);

  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastYear =
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const stats: WrappedStats | null = useMemo(() => {
    const s = getWrappedStats(expenses, lastYear, lastMonth);
    if (s.transactionCount === 0 && s.totalSpent === 0) return null;
    return s;
  }, [expenses, lastYear, lastMonth]);

  const monthLabel = useMemo(() => {
    const d = new Date(lastYear, lastMonth, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [lastYear, lastMonth]);

  const slides = useMemo(() => {
    if (!stats) return null;
    const list: React.ReactNode[] = [];

    list.push(
      <Slide key="intro" background="bg-primary/10">
        <Sparkles className="text-primary size-12" />
        <SlideTitle>Your expense wrapped</SlideTitle>
        <SlideValue>{monthLabel}</SlideValue>
        <p className="text-center text-sm text-muted-foreground">
          Hey {userName}, here’s how you spent last month.
        </p>
      </Slide>,
    );

    list.push(
      <Slide key="total" background="bg-primary/10">
        <SlideTitle>You spent</SlideTitle>
        <SlideValue>{formatCurrency(stats.totalSpent)}</SlideValue>
        <p className="text-muted-foreground text-center text-sm">
          in {monthLabel}
        </p>
      </Slide>,
    );

    list.push(
      <Slide key="transactions" background="bg-chart-1/15">
        <Receipt className="text-chart-1 size-12" />
        <SlideTitle>Transactions</SlideTitle>
        <SlideValue>{stats.transactionCount}</SlideValue>
        <p className="text-muted-foreground text-center text-sm">
          expenses logged
        </p>
      </Slide>,
    );

    if (stats.topCategoriesByAmount.length > 0) {
      const top = stats.topCategoriesByAmount[0];
      list.push(
        <Slide key="top-cat" background="bg-chart-2/15">
          <SlideTitle>Top category by spend</SlideTitle>
          <SlideValue>{top.category}</SlideValue>
          <p className="text-muted-foreground text-center text-lg">
            {formatCurrency(top.amount)} · {top.percentage.toFixed(0)}%
          </p>
        </Slide>,
      );
    }

    if (stats.mostUsedCategory && stats.mostUsedCategoryCount > 0) {
      list.push(
        <Slide key="most-used" background="bg-chart-3/15">
          <SlideTitle>You used this the most</SlideTitle>
          <SlideValue className="wrap-break-word text-2xl sm:text-3xl md:text-4xl">
            {stats.mostUsedCategory}
          </SlideValue>
          <p className="text-muted-foreground text-center text-sm">
            {stats.mostUsedCategoryCount} time
            {stats.mostUsedCategoryCount !== 1 ? "s" : ""}
          </p>
        </Slide>,
      );
    }

    if (stats.biggestExpense) {
      list.push(
        <Slide key="biggest" background="bg-chart-4/15">
          <SlideTitle>Biggest single expense</SlideTitle>
          <SlideValue>{formatCurrency(stats.biggestExpense.amount)}</SlideValue>
          <p className="text-muted-foreground text-center text-sm">
            {stats.biggestExpense.category}
          </p>
        </Slide>,
      );
    }

    if (stats.vsPreviousMonthPercent !== null) {
      const isUp = stats.vsPreviousMonthPercent > 0;
      list.push(
        <Slide
          key="vs"
          background={
            isUp
              ? "bg-amber-100 dark:bg-amber-950/40"
              : "bg-emerald-100 dark:bg-emerald-950/40"
          }
        >
          <SlideTitle>Vs previous month</SlideTitle>
          <div className="flex items-center gap-2">
            {isUp ? (
              <TrendingUp className="text-amber-600 dark:text-amber-400 size-10" />
            ) : (
              <TrendingDown className="text-emerald-600 dark:text-emerald-400 size-10" />
            )}
            <SlideValue>
              {isUp ? "+" : ""}
              {stats.vsPreviousMonthPercent}%
            </SlideValue>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {isUp ? "You spent more" : "You spent less"} than the month before
          </p>
        </Slide>,
      );
    }

    list.push(
      <Slide key="outro" background="bg-primary/10">
        <Sparkles className="text-primary size-12" />
        <SlideTitle>That’s your wrap</SlideTitle>
        <p className="text-center text-sm text-muted-foreground">
          See you next month for another recap.
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/" className="gap-2">
            Back to dashboard
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </Slide>,
    );

    return list;
  }, [stats, monthLabel, userName]);

  const totalSlides = slides?.length ?? 0;
  const canPrev = slideIndex > 0;
  const canNext = slideIndex < totalSlides - 1;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading your wrapped...</p>
      </div>
    );
  }

  if (!slides || totalSlides === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <p className="text-muted-foreground text-center">
          No expenses in {monthLabel} yet. Add some and come back next month for
          your wrap.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 z-10">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="gap-1 shadow-md"
        >
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="min-h-[80vh]">{slides[slideIndex]}</div>

      <div className="fixed bottom-6 left-0 right-0 flex items-center justify-center gap-4 px-4">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg"
          disabled={!canPrev}
          onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-muted-foreground text-sm">
          {slideIndex + 1} / {totalSlides}
        </span>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg"
          disabled={!canNext}
          onClick={() => setSlideIndex((i) => Math.min(totalSlides - 1, i + 1))}
        >
          <ArrowRight className="size-5" />
        </Button>
      </div>

      <div className="flex justify-center gap-1.5 pb-24 pt-2">
        {slides.map((_, i) => (
          <button
            // eslint-disable-next-line react/no-array-index-key -- dot order is fixed and matches slide index
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === slideIndex
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            onClick={() => setSlideIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
