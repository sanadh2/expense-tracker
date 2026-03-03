"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Sparkles } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useExpenses } from "@/lib/hooks/use-expenses";
import type { Expense } from "@/lib/types/expense";
import {
  ALL_CATEGORY_VALUES,
  CATEGORY_SEPARATOR,
  EXPENSE_CATEGORIES,
} from "@/lib/types/expense";
import { getMostUsedCategoriesFromLastMonth } from "@/lib/utils/analytics";
import type { ExpenseFormData } from "@/lib/validations/expense";
import { expenseFormSchema } from "@/lib/validations/expense";

const PAISE_PER_RUPEE = 100;

function parseDateString(value: string): Date | undefined {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DEFAULT_CATEGORY = "Food & Dining › Groceries";

function getSubmitButtonText(isPending: boolean, isEdit: boolean): string {
  if (isPending) return isEdit ? "Saving..." : "Adding...";
  return isEdit ? "Save" : "Add expense";
}

function getDefaultValues(
  expense: Expense | null | undefined,
): ExpenseFormData {
  const defaultDate = new Date().toISOString().split("T")[0];
  if (expense) {
    const validCategory = ALL_CATEGORY_VALUES.includes(expense.category)
      ? expense.category
      : DEFAULT_CATEGORY;
    return {
      amount: expense.amount / PAISE_PER_RUPEE,
      category: validCategory,
      note: expense.note ?? "",
      date: expense.date,
    };
  }
  return {
    amount: 0,
    category: DEFAULT_CATEGORY,
    note: "",
    date: defaultDate,
  };
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  expense?: Expense | null;
  isPending?: boolean;
  error?: Error | null;
}

function ExpenseFormContent({
  expense,
  onSubmit,
  onClose,
  isPending,
  error,
  suggestedCategories,
}: {
  expense?: Expense | null;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onClose: () => void;
  isPending?: boolean;
  error?: Error | null;
  suggestedCategories: string[];
}) {
  const isEdit = Boolean(expense);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: getDefaultValues(expense),
  });

  const handleFormSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    onClose();
  });

  const apiError = error as
    | (Error & {
        fieldErrors?: Record<string, string[]>;
      })
    | null;
  const hasFieldErrors = Boolean(apiError?.fieldErrors);
  const fieldErrorMessages = hasFieldErrors
    ? Object.values(apiError?.fieldErrors ?? {})
        .flat()
        .join(", ")
    : "";

  const submitButtonText = getSubmitButtonText(Boolean(isPending), isEdit);

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {hasFieldErrors && (
          <Alert variant="destructive">
            <AlertDescription>{fieldErrorMessages}</AlertDescription>
          </Alert>
        )}
        {error && !hasFieldErrors && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : 0,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              {suggestedCategories.length > 0 && (
                <div className="mb-2">
                  <p className="text-muted-foreground mb-1.5 flex items-center gap-1 text-xs">
                    <Sparkles className="size-3.5" />
                    Suggested from last month
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedCategories.map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant={
                          field.value === value ? "secondary" : "outline"
                        }
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => field.onChange(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[min(80vh,28rem)]!">
                  {Object.entries(EXPENSE_CATEGORIES).map(
                    ([category, subcategories]) => (
                      <SelectGroup key={category}>
                        <SelectLabel>{category}</SelectLabel>
                        {subcategories.map((sub) => {
                          const value = `${category}${CATEGORY_SEPARATOR}${sub}`;
                          return (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    ),
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => {
            const date = parseDateString(field.value);
            return (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        data-empty={!date}
                        className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {date ? formatDateDisplay(date) : "Pick a date"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selected) => {
                        field.onChange(
                          selected ? formatDateForInput(selected) : "",
                        );
                      }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add a note..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  expense,
  isPending,
  error,
}: ExpenseModalProps) {
  const { data: expenses = [] } = useExpenses();
  const suggestedCategories = useMemo(() => {
    if (expense) return [];
    return getMostUsedCategoriesFromLastMonth(expenses, 5);
  }, [expenses, expense]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
        </DialogHeader>
        <ExpenseFormContent
          key={expense?.id ?? "new"}
          expense={expense}
          onSubmit={onSubmit}
          onClose={onClose}
          isPending={isPending}
          error={error}
          suggestedCategories={suggestedCategories}
        />
      </DialogContent>
    </Dialog>
  );
}
