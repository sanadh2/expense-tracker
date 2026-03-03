import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { budgetRepository } from "@/db/repositories";
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

  const updated = await budgetRepository.updateByIdAndUserId(
    id,
    session.user.id,
    { amount: amountInPaise },
  );

  if (!updated) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
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

  const deleted = await budgetRepository.deleteByIdAndUserId(
    id,
    session.user.id,
  );

  if (!deleted) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
