"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { BudgetLimits } from "./budget-limits";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { ExpenseList } from "./expense-list";
import { SpendingTrendsChart } from "./spending-trends-chart";
import { SummaryCards } from "./summary-cards";

export function ExpenseDashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-10 pb-12">
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Overview
        </h2>
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
