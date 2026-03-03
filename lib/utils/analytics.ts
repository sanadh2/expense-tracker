import { type Expense } from "@/lib/types/expense";
import { CATEGORY_SEPARATOR } from "@/lib/types/expense";

const PAISE_PER_RUPEE = 100;

export function sumPaise(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0);
}

export function rupees(paise: number): number {
  return paise / PAISE_PER_RUPEE;
}

export function getMainCategory(fullCategory: string): string {
  const idx = fullCategory.indexOf(CATEGORY_SEPARATOR);
  if (idx === -1) return fullCategory;
  return fullCategory.slice(0, idx);
}

/** Date string YYYY-MM-DD to start of day timestamp */
function dateToStart(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getTime();
}

/** Get start of week (Sunday) for a date */
function getWeekStart(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

/** Get start of month for a date */
function getMonthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function filterExpensesByDateRange(
  expenses: Expense[],
  start: Date,
  end: Date,
): Expense[] {
  const startTs = start.getTime();
  const endTs = end.getTime() + 86400000;
  return expenses.filter((e) => {
    const t = dateToStart(e.date);
    return t >= startTs && t < endTs;
  });
}

export function filterExpensesBySearch(
  expenses: Expense[],
  search: string,
): Expense[] {
  const q = search.trim().toLowerCase();
  if (!q) return expenses;
  return expenses.filter(
    (e) =>
      e.category.toLowerCase().includes(q) ||
      (e.note?.toLowerCase().includes(q) ?? false),
  );
}

export function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = getWeekStart(now);
  const end = new Date(now);
  return { start, end };
}

export function getLastWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const thisWeekStart = getWeekStart(now);
  const start = new Date(thisWeekStart);
  start.setDate(start.getDate() - 7);
  const end = new Date(thisWeekStart);
  end.setDate(end.getDate() - 1);
  return { start, end };
}

export function getThisMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = getMonthStart(now);
  const end = new Date(now);
  return { start, end };
}

/** Default date range for chart views when no custom range is selected */
export function getDefaultRangeForView(
  view: "daily" | "weekly" | "monthly",
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);

  if (view === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return { start: getMonthStart(start), end };
  }
  if (view === "weekly") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7 * 7);
    return { start: getWeekStart(start), end };
  }
  // daily: last 30 days
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function getLastMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start, end };
}

/** Get start/end of a specific calendar month (month 0-indexed) */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

export interface WrappedStats {
  year: number;
  month: number;
  monthLabel: string;
  totalSpent: number;
  transactionCount: number;
  topCategoriesByAmount: { category: string; amount: number; percentage: number }[];
  mostUsedCategory: string | null;
  mostUsedCategoryCount: number;
  biggestExpense: { amount: number; category: string; date: string } | null;
  vsPreviousMonthPercent: number | null;
}

/**
 * Stats for a "Wrapped" recap for a given month (e.g. last month).
 * Use for Spotify-style monthly expense wrapped.
 */
export function getWrappedStats(
  expenses: Expense[],
  year: number,
  month: number,
): WrappedStats {
  const { start, end } = getMonthRange(year, month);
  const monthExpenses = filterExpensesByDateRange(expenses, start, end);
  const totalSpent = sumPaise(monthExpenses);
  const topByAmount = aggregateByMainCategory(monthExpenses).slice(0, 5);

  const byFullCategory = new Map<string, number>();
  for (const e of monthExpenses) {
    byFullCategory.set(e.category, (byFullCategory.get(e.category) ?? 0) + 1);
  }
  const mostUsed = Array.from(byFullCategory.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const mostUsedCategory = mostUsed?.[0] ?? null;
  const mostUsedCategoryCount = mostUsed?.[1] ?? 0;

  const biggest = monthExpenses.length
    ? monthExpenses.reduce((a, b) => (a.amount >= b.amount ? a : b))
    : null;
  const biggestExpense = biggest
    ? {
        amount: biggest.amount,
        category: biggest.category,
        date: biggest.date,
      }
    : null;

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const { start: prevStart, end: prevEnd } = getMonthRange(prevYear, prevMonth);
  const prevTotal = sumPaise(
    filterExpensesByDateRange(expenses, prevStart, prevEnd),
  );
  const vsPreviousMonthPercent =
    prevTotal > 0 && totalSpent > 0
      ? Math.round(((totalSpent - prevTotal) / prevTotal) * 100)
      : null;

  const monthLabel = start.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return {
    year,
    month,
    monthLabel,
    totalSpent,
    transactionCount: monthExpenses.length,
    topCategoriesByAmount: topByAmount.map((c) => ({
      category: c.category,
      amount: c.amount,
      percentage: c.percentage,
    })),
    mostUsedCategory,
    mostUsedCategoryCount,
    biggestExpense,
    vsPreviousMonthPercent,
  };
}

/**
 * Returns the most used full categories (e.g. "Food & Dining › Groceries") from last month,
 * sorted by transaction count (desc), then by total amount (desc). Useful for suggesting
 * categories in the add-expense form.
 */
export function getMostUsedCategoriesFromLastMonth(
  expenses: Expense[],
  limit = 8,
): string[] {
  const { start, end } = getLastMonthRange();
  const lastMonth = filterExpensesByDateRange(expenses, start, end);
  const byCategory = new Map<string, { count: number; amount: number }>();
  for (const e of lastMonth) {
    const cat = e.category;
    const cur = byCategory.get(cat) ?? { count: 0, amount: 0 };
    byCategory.set(cat, {
      count: cur.count + 1,
      amount: cur.amount + e.amount,
    });
  }
  return Array.from(byCategory.entries())
    .sort((a, b) => {
      const [cA, cB] = [a[1].count, b[1].count];
      if (cA !== cB) return cB - cA;
      return b[1].amount - a[1].amount;
    })
    .slice(0, limit)
    .map(([cat]) => cat);
}

export interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
}

export function aggregateByMainCategory(expenses: Expense[]): CategorySpend[] {
  const total = sumPaise(expenses);
  if (total === 0) return [];

  const map = new Map<string, number>();
  for (const e of expenses) {
    const main = getMainCategory(e.category);
    map.set(main, (map.get(main) ?? 0) + e.amount);
  }

  return Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface PeriodSpend {
  label: string;
  amount: number;
  date: string; // YYYY-MM-DD or "Week of ..."
}

/** Weekly aggregation for last N weeks */
export function aggregateWeekly(expenses: Expense[], weeks = 8): PeriodSpend[] {
  const now = new Date();
  const result: PeriodSpend[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = getWeekStart(d);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const filtered = filterExpensesByDateRange(expenses, weekStart, weekEnd);
    const amount = sumPaise(filtered);
    result.push({
      label: `Week of ${weekStart.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })}`,
      amount,
      date: weekStart.toISOString().slice(0, 10),
    });
  }

  return result;
}

/** Monthly aggregation for last N months */
export function aggregateMonthly(
  expenses: Expense[],
  months = 6,
): PeriodSpend[] {
  const now = new Date();
  const result: PeriodSpend[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = getMonthStart(d);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const filtered = filterExpensesByDateRange(expenses, start, end);
    const amount = sumPaise(filtered);
    result.push({
      label: start.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      amount,
      date: start.toISOString().slice(0, 7),
    });
  }

  return result;
}

export function aggregateDaily(expenses: Expense[], days = 30): PeriodSpend[] {
  const now = new Date();
  const result: PeriodSpend[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayStart = new Date(`${dateStr}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const filtered = filterExpensesByDateRange(expenses, dayStart, dayEnd);
    const amount = sumPaise(filtered);
    result.push({
      label: d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      amount,
      date: dateStr,
    });
  }

  return result;
}

export interface PeriodRange {
  label: string;
  start: Date;
  end: Date;
}

export function getWeeklyPeriodRanges(weeks = 8): PeriodRange[] {
  const now = new Date();
  const result: PeriodRange[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = getWeekStart(d);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    result.push({
      label: `Week of ${weekStart.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })}`,
      start: weekStart,
      end: weekEnd,
    });
  }
  return result;
}

export function getMonthlyPeriodRanges(months = 6): PeriodRange[] {
  const now = new Date();
  const result: PeriodRange[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = getMonthStart(d);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    result.push({
      label: start.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      start,
      end,
    });
  }
  return result;
}

export function getDailyPeriodRanges(days = 30): PeriodRange[] {
  const now = new Date();
  const result: PeriodRange[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayStart = new Date(`${dateStr}T00:00:00`);
    result.push({
      label: d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      start: dayStart,
      end: dayStart,
    });
  }
  return result;
}

export type PeriodType = "daily" | "weekly" | "monthly";

export function getPeriodRangesInRange(
  type: PeriodType,
  rangeStart: Date,
  rangeEnd: Date,
): PeriodRange[] {
  const result: PeriodRange[] = [];
  const startTs = rangeStart.getTime();
  const endTs = rangeEnd.getTime() + 86400000;

  if (type === "daily") {
    const d = new Date(rangeStart);
    d.setHours(0, 0, 0, 0);
    while (d.getTime() < endTs) {
      const dayStart = new Date(d);
      result.push({
        label: d.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        start: dayStart,
        end: dayStart,
      });
      d.setDate(d.getDate() + 1);
    }
    return result;
  }

  if (type === "weekly") {
    const d = new Date(rangeStart);
    const weekStart = getWeekStart(d);
    const current = new Date(weekStart);
    while (current.getTime() < endTs) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd.getTime() >= startTs) {
        result.push({
          label: `Week of ${current.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          })}`,
          start: new Date(current),
          end: weekEnd,
        });
      }
      current.setDate(current.getDate() + 7);
    }
    return result;
  }

  const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (d.getTime() < endTs) {
    const monthStart = new Date(d);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    if (monthEnd.getTime() >= startTs) {
      result.push({
        label: monthStart.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        start: monthStart,
        end: monthEnd,
      });
    }
    d.setMonth(d.getMonth() + 1);
  }
  return result;
}

export interface PeriodCategoryRow {
  name: string;
  [key: string]: number | string;
}

export function aggregatePeriodsByCategory(
  expenses: Expense[],
  periods: PeriodRange[],
): PeriodCategoryRow[] {
  const allCategories = new Set<string>();
  const rows: PeriodCategoryRow[] = periods.map(({ label, start, end }) => {
    const filtered = filterExpensesByDateRange(expenses, start, end);
    const byCategory = aggregateByMainCategory(filtered);
    const row: PeriodCategoryRow = { name: label };
    for (const { category, amount } of byCategory) {
      allCategories.add(category);
      row[category] = amount;
    }
    return row;
  });
  for (const row of rows) {
    for (const cat of allCategories) {
      row[cat] ??= 0;
    }
  }
  return rows;
}
