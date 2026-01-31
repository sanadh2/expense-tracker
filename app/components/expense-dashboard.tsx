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
    <div className="space-y-8">
      <SummaryCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryBreakdownChart />
        <SpendingTrendsChart />
      </div>

      <BudgetLimits />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Expenses</h2>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            Add expense
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card p-6">
          <ExpenseList
            isAddModalOpen={isAddModalOpen}
            onAddModalOpenChange={setIsAddModalOpen}
          />
        </div>
      </div>
    </div>
  );
}
