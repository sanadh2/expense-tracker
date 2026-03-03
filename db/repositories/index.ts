import { db } from "@/db";

import { BudgetRepository } from "./budget.repository";
import { ExpenseRepository } from "./expense.repository";

export const expenseRepository = new ExpenseRepository(db);
export const budgetRepository = new BudgetRepository(db);

export type { BudgetInsert, BudgetRow } from "./budget.repository";
export { BudgetRepository } from "./budget.repository";
export type {
  ExpenseInsert,
  ExpenseRow,
  ListExpensesFilters,
} from "./expense.repository";
export { ExpenseRepository } from "./expense.repository";
