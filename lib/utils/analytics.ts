import { type Expense } from "@/lib/types/expense";
import { CATEGORY_SEPARATOR } from "@/lib/types/expense";

const PAISE_PER_RUPEE = 100;

export function sumPaise(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0);
}

export function rupees(paise: number): number {
  return paise / PAISE_PER_RUPEE;
}

/** Get main category from full category (e.g. "Food & Dining › Groceries" → "Food & Dining") */
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
  const endTs = end.getTime() + 86400000; // end of end date
  return expenses.filter((e) => {
    const t = dateToStart(e.date);
    return t >= startTs && t < endTs;
  });
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

export function getLastMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start, end };
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
