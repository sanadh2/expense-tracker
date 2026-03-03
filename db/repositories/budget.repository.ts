import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type * as schema from "@/db/schema";
import { budget } from "@/db/schema";

export type BudgetRow = typeof budget.$inferSelect;
export type BudgetInsert = typeof budget.$inferInsert;

export class BudgetRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findAllByUserId(userId: string): Promise<BudgetRow[]> {
    return this.db.select().from(budget).where(eq(budget.userId, userId));
  }

  async findByUserIdAndCategory(
    userId: string,
    category: string,
  ): Promise<BudgetRow | undefined> {
    const [row] = await this.db
      .select()
      .from(budget)
      .where(and(eq(budget.userId, userId), eq(budget.category, category)))
      .limit(1);
    return row;
  }

  async create(data: BudgetInsert): Promise<BudgetRow> {
    const [row] = await this.db.insert(budget).values(data).returning();
    return row;
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    data: Partial<Omit<BudgetInsert, "id" | "userId" | "createdAt">>,
  ): Promise<BudgetRow | undefined> {
    const [row] = await this.db
      .update(budget)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(budget.id, id), eq(budget.userId, userId)))
      .returning();
    return row;
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(budget)
      .where(and(eq(budget.id, id), eq(budget.userId, userId)))
      .returning({ id: budget.id });
    return deleted.length > 0;
  }
}
