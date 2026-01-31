import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { budget } from "@/db/schema";
import { auth } from "@/lib/auth";

const updateBudgetSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const parsed = updateBudgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const PAISE_PER_RUPEE = 100;
  const amountInPaise = Math.round(parsed.data.amount * PAISE_PER_RUPEE);

  const updatedList = await db
    .update(budget)
    .set({ amount: amountInPaise, updatedAt: new Date() })
    .where(and(eq(budget.id, id), eq(budget.userId, session.user.id)))
    .returning();

  if (updatedList.length === 0) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  return NextResponse.json(updatedList[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deletedList = await db
    .delete(budget)
    .where(and(eq(budget.id, id), eq(budget.userId, session.user.id)))
    .returning();

  if (deletedList.length === 0) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
