"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategoryKey,
} from "@/lib/types/expense";

const budgetFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be greater than 0"),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

const MAIN_CATEGORIES = Object.keys(EXPENSE_CATEGORIES) as ExpenseCategoryKey[];

function getSubmitButtonText(isPending: boolean, isEdit: boolean): string {
  if (isPending) return "Saving...";
  if (isEdit) return "Update";
  return "Add";
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetFormData) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  defaultCategory?: string;
  defaultAmount?: number;
}

export function BudgetModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  error,
  defaultCategory,
  defaultAmount,
}: BudgetModalProps) {
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: defaultCategory ?? "",
      amount: defaultAmount ? defaultAmount / 100 : undefined,
    },
  });

  useEffect(() => {
    form.reset({
      category: defaultCategory ?? "",
      amount: defaultAmount ? defaultAmount / 100 : undefined,
    });
  }, [defaultCategory, defaultAmount, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    form.reset({ category: "", amount: undefined });
    onClose();
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {defaultCategory ? "Edit budget" : "Add budget"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong"}
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!defaultCategory}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MAIN_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly limit (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min={1}
                      step={0.01}
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {getSubmitButtonText(isPending, !!defaultCategory)}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
