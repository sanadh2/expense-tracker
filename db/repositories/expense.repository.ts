import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type * as schema from "@/db/schema";
import { expense } from "@/db/schema";

export type ExpenseRow = typeof expense.$inferSelect;
export type ExpenseInsert = typeof expense.$inferInsert;

export interface ListExpensesFilters {
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
  usePagination: boolean;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class ExpenseRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findAllByUserId(userId: string): Promise<ExpenseRow[]> {
    return this.db
      .select()
      .from(expense)
      .where(eq(expense.userId, userId))
      .orderBy(desc(expense.date));
  }

  async listFiltered(
    userId: string,
    filters: ListExpensesFilters,
  ): Promise<{ rows: ExpenseRow[]; total: number }> {
    const conditions = [eq(expense.userId, userId)];

    if (filters.startDate && DATE_REGEX.test(filters.startDate)) {
      conditions.push(gte(expense.date, filters.startDate));
    }
    if (filters.endDate && DATE_REGEX.test(filters.endDate)) {
      conditions.push(lte(expense.date, filters.endDate));
    }
    if (filters.search?.trim()) {
      const pattern = `%${filters.search.replace(/%/g, "\\%")}%`;
      conditions.push(
        or(ilike(expense.category, pattern), ilike(expense.note, pattern)) ??
          sql`false`,
      );
    }

    const whereClause = and(...conditions);

    const [{ count: total }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(expense)
      .where(whereClause);

    if (filters.usePagination) {
      const rows = await this.db
        .select()
        .from(expense)
        .where(whereClause)
        .orderBy(desc(expense.date))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit);
      return { rows, total };
    }

    const rows = await this.db
      .select()
      .from(expense)
      .where(whereClause)
      .orderBy(desc(expense.date));
    return { rows, total };
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<ExpenseRow | undefined> {
    const [row] = await this.db
      .select()
      .from(expense)
      .where(and(eq(expense.id, id), eq(expense.userId, userId)));
    return row;
  }

  async create(data: ExpenseInsert): Promise<ExpenseRow> {
    const [row] = await this.db.insert(expense).values(data).returning();
    return row;
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    data: Partial<Omit<ExpenseInsert, "id" | "userId" | "createdAt">>,
  ): Promise<ExpenseRow | undefined> {
    const [row] = await this.db
      .update(expense)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(expense.id, id), eq(expense.userId, userId)))
      .returning();
    return row;
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(expense)
      .where(and(eq(expense.id, id), eq(expense.userId, userId)))
      .returning({ id: expense.id });
    return deleted.length > 0;
  }
}
