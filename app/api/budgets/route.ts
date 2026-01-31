import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { budget } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategoryKey,
} from "@/lib/types/expense";

const MAIN_CATEGORIES = Object.keys(EXPENSE_CATEGORIES) as unknown as readonly [
  ExpenseCategoryKey,
  ...ExpenseCategoryKey[],
];

const createBudgetSchema = z.object({
  category: z.enum(MAIN_CATEGORIES),
  amount: z.number().positive("Amount must be positive"),
});

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const budgets = await db
    .select()
    .from(budget)
    .where(eq(budget.userId, session.user.id));

  return NextResponse.json(budgets);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createBudgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { category, amount } = parsed.data;
  const PAISE_PER_RUPEE = 100;
  const amountInPaise = Math.round(amount * PAISE_PER_RUPEE);

  const existingList = await db
    .select()
    .from(budget)
    .where(
      and(eq(budget.userId, session.user.id), eq(budget.category, category)),
    )
    .limit(1);

  if (existingList.length > 0) {
    const existing = existingList[0];
    const [updated] = await db
      .update(budget)
      .set({ amount: amountInPaise, updatedAt: new Date() })
      .where(eq(budget.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [newBudget] = await db
    .insert(budget)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      category,
      amount: amountInPaise,
    })
    .returning();

  return NextResponse.json(newBudget);
}
