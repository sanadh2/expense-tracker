import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { expense } from "@/db/schema";
import { auth } from "@/lib/auth";

const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  note: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await db
    .select()
    .from(expense)
    .where(eq(expense.userId, session.user.id))
    .orderBy(desc(expense.date));

  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { amount, category, note, date } = parsed.data;

  const PAISE_PER_RUPEE = 100;
  const amountInPaise = Math.round(amount * PAISE_PER_RUPEE);

  const [newExpense] = await db
    .insert(expense)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      amount: amountInPaise,
      category,
      note: note ?? null,
      date,
    })
    .returning();

  return NextResponse.json(newExpense);
}
