"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { ExpenseList } from "./expense-list";

export function ExpenseDashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
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
  );
}
