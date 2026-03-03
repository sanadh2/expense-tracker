"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { BudgetLimits } from "./budget-limits";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { ExpenseList } from "./expense-list";
import { SpendingTrendsChart } from "./spending-trends-chart";
import { SummaryCards } from "./summary-cards";

function getLastMonthLabel(): string {
  const d = new Date();
  const lastMonth = d.getMonth() === 0 ? 11 : d.getMonth() - 1;
  const year = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
  return new Date(year, lastMonth, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function ExpenseDashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const lastMonthLabel = getLastMonthLabel();

  return (
    <div className="space-y-10 pb-12">
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Overview
        </h2>
        <Link
          href="/wrapped"
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 to-primary/5 p-4 transition-colors hover:from-primary/15 hover:to-primary/10"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
            <Sparkles className="text-primary size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Your Expense Wrapped</p>
            <p className="text-muted-foreground text-sm">
              See your {lastMonthLabel} recap
            </p>
          </div>
          <span className="text-muted-foreground text-sm">View →</span>
        </Link>
        <SummaryCards />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Spending insights
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <SpendingTrendsChart />
          <CategoryBreakdownChart />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Budgets
        </h2>
        <BudgetLimits />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Recent expenses
          </h2>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            Add expense
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <ExpenseList
            isAddModalOpen={isAddModalOpen}
            onAddModalOpenChange={setIsAddModalOpen}
          />
        </div>
      </section>
    </div>
  );
}
