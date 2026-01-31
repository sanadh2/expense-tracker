"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  MoreVertical,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type Budget,
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from "@/lib/hooks/use-budgets";
import { useExpenses } from "@/lib/hooks/use-expenses";
import type { Expense } from "@/lib/types/expense";
import {
  filterExpensesByDateRange,
  getMainCategory,
  getThisMonthRange,
} from "@/lib/utils/analytics";

import { BudgetModal } from "./budget-modal";

const PAISE_PER_RUPEE = 100;
const WARN_THRESHOLD = 0.8; // 80%
const ALERT_THRESHOLD = 1; // 100%

function getBudgetStatus(ratio: number): "ok" | "warning" | "exceeded" {
  if (ratio >= ALERT_THRESHOLD) return "exceeded";
  if (ratio >= WARN_THRESHOLD) return "warning";
  return "ok";
}

function getStatusTextClass(status: "ok" | "warning" | "exceeded"): string {
  if (status === "exceeded") return "text-destructive font-medium";
  if (status === "warning")
    return "text-amber-600 dark:text-amber-500 font-medium";
  return "text-muted-foreground";
}

function getProgressBarClass(status: "ok" | "warning" | "exceeded"): string {
  if (status === "exceeded") return "bg-destructive";
  if (status === "warning") return "bg-amber-500";
  return "bg-primary";
}

const formatCurrency = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(paise / PAISE_PER_RUPEE);

function getSpentByCategory(expenses: Expense[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const main = getMainCategory(e.category);
    map.set(main, (map.get(main) ?? 0) + e.amount);
  }
  return map;
}

export function BudgetLimits() {
  const { data: budgets = [], isLoading } = useBudgets();
  const { data: expenses = [] } = useExpenses();
  const createBudgetHook = useCreateBudget();
  const updateBudgetHook = useUpdateBudget();
  const deleteBudgetHook = useDeleteBudget();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const { start, end } = getThisMonthRange();
  const thisMonthExpenses = filterExpensesByDateRange(expenses, start, end);
  const spentByCategory = getSpentByCategory(thisMonthExpenses);

  const budgetWithSpent = budgets.map((b) => {
    const spent = spentByCategory.get(b.category) ?? 0;
    const ratio = b.amount > 0 ? spent / b.amount : 0;
    const status = getBudgetStatus(ratio);
    return { ...b, spent, ratio, status };
  });

  const exceededBudgets = budgetWithSpent.filter(
    (b) => b.status === "exceeded",
  );
  const warningBudgets = budgetWithSpent.filter((b) => b.status === "warning");

  const handleCreate = async (data: { category: string; amount: number }) => {
    await createBudgetHook.mutateAsync({
      category: data.category,
      amount: data.amount,
    });
    setIsAddOpen(false);
  };

  const handleUpdate = async (data: { category: string; amount: number }) => {
    if (!editingBudget) return;
    await updateBudgetHook.mutateAsync({
      id: editingBudget.id,
      amount: data.amount,
    });
    setEditingBudget(null);
  };

  const handleDelete = (id: string) => {
    deleteBudgetHook.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget limits</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Budget limits</CardTitle>
            <p className="text-muted-foreground text-xs">
              Monthly limits by category
            </p>
          </div>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            Add budget
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {(exceededBudgets.length > 0 || warningBudgets.length > 0) && (
            <div className="space-y-2">
              {exceededBudgets.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Budget exceeded</AlertTitle>
                  <AlertDescription>
                    {exceededBudgets.map((b) => b.category).join(", ")} —
                    consider adjusting your spending or limits.
                  </AlertDescription>
                </Alert>
              )}
              {warningBudgets.length > 0 && exceededBudgets.length === 0 && (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Approaching limit</AlertTitle>
                  <AlertDescription>
                    {warningBudgets.map((b) => b.category).join(", ")} —
                    you&apos;ve used 80% or more of your budget.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {budgetWithSpent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 py-10">
              <Banknote className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-center text-sm">
                No budgets set. Add monthly limits to track spending by
                category.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddOpen(true)}
              >
                Add your first budget
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetWithSpent.map((b) => (
                <div
                  key={b.id}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={getStatusTextClass(b.status)}>
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Actions"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setEditingBudget({
                                ...b,
                                amount: b.amount,
                              })
                            }
                          >
                            <PencilIcon className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(b.id)}
                          >
                            <Trash2Icon className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressBarClass(b.status)}`}
                      style={{
                        width: `${Math.min(b.ratio * 100, 100)}%`,
                      }}
                    />
                  </div>
                  {b.ratio > 1 && (
                    <p className="text-destructive mt-1 text-xs">
                      {((b.ratio - 1) * 100).toFixed(0)}% over budget
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BudgetModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
        isPending={createBudgetHook.isPending}
        error={createBudgetHook.error}
      />

      <BudgetModal
        isOpen={Boolean(editingBudget)}
        onClose={() => setEditingBudget(null)}
        onSubmit={handleUpdate}
        isPending={updateBudgetHook.isPending}
        error={updateBudgetHook.error}
        defaultCategory={editingBudget?.category}
        defaultAmount={editingBudget?.amount}
      />
    </>
  );
}
