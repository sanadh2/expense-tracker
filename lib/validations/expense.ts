import { z } from "zod";

import { ALL_CATEGORY_VALUES } from "@/lib/types/expense";

const MAX_NOTE_LENGTH = 500;

export const expenseFormSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z
    .string()
    .min(1, "Category is required")
    .refine((val) => ALL_CATEGORY_VALUES.includes(val), "Invalid category"),
  note: z
    .string()
    .max(MAX_NOTE_LENGTH, "Note must be less than 500 characters")
    .optional(),
  date: z
    .string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
