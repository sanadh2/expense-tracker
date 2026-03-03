import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { budgetRepository } from "@/db/repositories";
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

  const budgets = await budgetRepository.findAllByUserId(session.user.id);

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

  const existing = await budgetRepository.findByUserIdAndCategory(
    session.user.id,
    category,
  );

  if (existing) {
    const updated = await budgetRepository.updateByIdAndUserId(
      existing.id,
      session.user.id,
      { amount: amountInPaise },
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update budget" },
        { status: 500 },
      );
    }
    return NextResponse.json(updated);
  }

  const newBudget = await budgetRepository.create({
    id: crypto.randomUUID(),
    userId: session.user.id,
    category,
    amount: amountInPaise,
  });

  return NextResponse.json(newBudget);
}
