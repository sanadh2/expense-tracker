"use client";

import { useState } from "react";
import { MoreVertical, PencilIcon, SearchIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
} from "@/lib/hooks/use-expenses";
import { CATEGORY_SEPARATOR, type Expense } from "@/lib/types/expense";
import type { ExpenseFormData } from "@/lib/validations/expense";

import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ExpenseModal } from "./expense-modal";

const PAISE_PER_RUPEE = 100;
const SKELETON_ROW_COUNT = 3;

const formatCurrency = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / PAISE_PER_RUPEE);

function parseCategory(value: string): {
  category: string;
  subcategory: string;
} {
  const idx = value.indexOf(CATEGORY_SEPARATOR);
  if (idx === -1) {
    return { category: value, subcategory: "" };
  }
  return {
    category: value.slice(0, idx),
    subcategory: value.slice(idx + CATEGORY_SEPARATOR.length),
  };
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

interface ExpenseListProps {
  isAddModalOpen: boolean;
  onAddModalOpenChange: (open: boolean) => void;
}

export function ExpenseList({
  isAddModalOpen,
  onAddModalOpenChange,
}: ExpenseListProps) {
  const { data: expenses = [], isLoading, error } = useExpenses();
  const deleteExpense = useDeleteExpense();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const handleCreate = async (data: ExpenseFormData) => {
    await createExpense.mutateAsync(data);
    onAddModalOpenChange(false);
  };

  const handleUpdate = async (data: ExpenseFormData) => {
    if (!editingExpense) {
      return;
    }
    await updateExpense.mutateAsync({ id: editingExpense.id, data });
    setEditingExpense(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingExpense) {
      return;
    }
    deleteExpense.mutate(deletingExpense.id, {
      onSuccess: () => setDeletingExpense(null),
    });
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Amount</TableHead>
            <TableHead className="px-4">Category</TableHead>
            <TableHead className="px-4">Subcategory</TableHead>
            <TableHead className="px-4">Date</TableHead>
            <TableHead className="px-4">Note</TableHead>
            <TableHead className="w-[60px] px-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
            <TableRow key={i}>
              <TableCell className="px-4">
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-5 w-32" />
              </TableCell>
              <TableCell className="px-4">
                <Skeleton className="h-8 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
        Failed to load expenses. Please try again.
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-border/60 bg-muted/30 py-20">
          <p className="text-muted-foreground text-center text-sm">
            No expenses yet. Add your first expense to get started.
          </p>
          <Button onClick={() => onAddModalOpenChange(true)} size="sm">
            Add expense
          </Button>
        </div>
        <ExpenseModal
          isOpen={isAddModalOpen}
          onClose={() => onAddModalOpenChange(false)}
          onSubmit={handleCreate}
          isPending={createExpense.isPending}
          error={createExpense.error}
        />
      </>
    );
  }

  const filteredAndSortedExpenses = [...expenses]
    .filter((expense) => {
      if (!searchQuery.trim()) {
        return true;
      }
      const q = searchQuery.trim().toLowerCase();
      const { category, subcategory } = parseCategory(expense.category);
      const note = expense.note ?? "";
      return (
        category.toLowerCase().includes(q) ||
        subcategory.toLowerCase().includes(q) ||
        note.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search by category, subcategory, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Amount</TableHead>
            <TableHead className="px-4">Category</TableHead>
            <TableHead className="px-4">Subcategory</TableHead>
            <TableHead className="px-4">Date</TableHead>
            <TableHead className="min-w-[120px] px-4">Note</TableHead>
            <TableHead className="w-[60px] px-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedExpenses.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-12 text-center text-muted-foreground"
              >
                No expenses match your search.
              </TableCell>
            </TableRow>
          ) : (
            filteredAndSortedExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="px-4 font-medium">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell className="px-4">
                  {parseCategory(expense.category).category}
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {parseCategory(expense.category).subcategory || "—"}
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {formatDate(expense.date)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate px-4 text-muted-foreground">
                  {expense.note ?? "—"}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Actions"
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingExpense(expense)}
                      >
                        <PencilIcon className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeletingExpense(expense)}
                      >
                        <Trash2Icon className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => onAddModalOpenChange(false)}
        onSubmit={handleCreate}
        isPending={createExpense.isPending}
        error={createExpense.error}
      />

      <ExpenseModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        onSubmit={handleUpdate}
        expense={editingExpense}
        isPending={updateExpense.isPending}
        error={updateExpense.error}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteExpense.isPending}
      />
    </>
  );
}
