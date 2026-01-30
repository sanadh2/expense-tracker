"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { Expense } from "@/lib/types/expense";
import type { ExpenseFormData } from "@/lib/validations/expense";

import { queryKeys } from "./use-api";

const PAISE_PER_RUPEE = 100;
const EXPENSES_QUERY_KEY = [...queryKeys.all, "expenses"] as const;

function sortByDateDesc(expenses: Expense[]) {
  return [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function useExpenses() {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEY,
    queryFn: () => api.get<Expense[]>("/api/expenses"),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExpenseFormData) =>
      api.post<Expense>("/api/expenses", data),
    onSuccess: (newExpense) => {
      queryClient.setQueryData<Expense[]>(EXPENSES_QUERY_KEY, (old) =>
        sortByDateDesc([...(old ?? []), newExpense]),
      );
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ExpenseFormData>;
    }) => api.put<Expense>(`/api/expenses/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: EXPENSES_QUERY_KEY });
      const previous = queryClient.getQueryData<Expense[]>(EXPENSES_QUERY_KEY);
      queryClient.setQueryData<Expense[]>(EXPENSES_QUERY_KEY, (old) =>
        old?.map((e) => {
          if (e.id !== id) {
            return e;
          }
          return {
            ...e,
            ...(data.amount !== undefined && {
              amount: Math.round(data.amount * PAISE_PER_RUPEE),
            }),
            ...(data.category !== undefined && { category: data.category }),
            ...(data.note !== undefined && { note: data.note }),
            ...(data.date !== undefined && { date: data.date }),
          } as Expense;
        }),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(EXPENSES_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (updatedExpense) => {
      queryClient.setQueryData<Expense[]>(EXPENSES_QUERY_KEY, (old) => {
        const mapped = old?.map((e) =>
          e.id === updatedExpense.id ? updatedExpense : e,
        ) ?? [updatedExpense];
        return sortByDateDesc(mapped);
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/expenses/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: EXPENSES_QUERY_KEY });
      const previous = queryClient.getQueryData<Expense[]>(EXPENSES_QUERY_KEY);
      queryClient.setQueryData<Expense[]>(
        EXPENSES_QUERY_KEY,
        (old) => old?.filter((e) => e.id !== id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(EXPENSES_QUERY_KEY, context.previous);
      }
    },
  });
}
