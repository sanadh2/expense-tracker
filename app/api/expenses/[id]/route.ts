import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { expenseRepository } from "@/db/repositories";
import { auth } from "@/lib/auth";

const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  note: z.string().optional().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function GET(
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

  const found = await expenseRepository.findByIdAndUserId(id, session.user.id);

  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(found);
}

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
  const parsed = updateExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updateData: {
    amount?: number;
    category?: string;
    note?: string | null;
    date?: string;
  } = {};
  if (parsed.data.amount !== undefined) {
    updateData.amount = Math.round(parsed.data.amount * 100);
  }
  if (parsed.data.category !== undefined) {
    updateData.category = parsed.data.category;
  }
  if (parsed.data.note !== undefined) updateData.note = parsed.data.note;
  if (parsed.data.date !== undefined) updateData.date = parsed.data.date;

  const updated = await expenseRepository.updateByIdAndUserId(
    id,
    session.user.id,
    updateData,
  );

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const deleted = await expenseRepository.deleteByIdAndUserId(
    id,
    session.user.id,
  );

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
