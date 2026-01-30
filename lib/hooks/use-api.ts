"use client";

// Query key factory for consistent cache keys across the app
export const queryKeys = {
  all: ["api"] as const,
};

/**
 * Example pattern for GET requests - use when adding API routes:
 *
 * import { useQuery } from "@tanstack/react-query";
 * import { api } from "@/lib/api";
 *
 * export function useExpenses() {
 *   return useQuery({
 *     queryKey: [...queryKeys.all, "expenses"],
 *     queryFn: () => api.get<Expense[]>("/api/expenses"),
 *   });
 * }
 *
 * Example pattern for mutations - use when adding API routes:
 *
 * import { useMutation, useQueryClient } from "@tanstack/react-query";
 * import { api } from "@/lib/api";
 *
 * export function useCreateExpense() {
 *   const queryClient = useQueryClient();
 *   return useMutation({
 *     mutationFn: (data: CreateExpenseInput) => api.post("/api/expenses", data),
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({ queryKey: queryKeys.all });
 *     },
 *   });
 * }
 */
