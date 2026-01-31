import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { expense } from "@/db/schema";
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

  const foundList = await db
    .select()
    .from(expense)
    .where(and(eq(expense.id, id), eq(expense.userId, session.user.id)));

  if (foundList.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(foundList[0]);
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

  const updatedList = await db
    .update(expense)
    .set({
      ...(parsed.data.amount !== undefined && {
        amount: Math.round(parsed.data.amount * 100),
      }),
      ...(parsed.data.category !== undefined && {
        category: parsed.data.category,
      }),
      ...(parsed.data.note !== undefined && { note: parsed.data.note }),
      ...(parsed.data.date !== undefined && { date: parsed.data.date }),
      updatedAt: new Date(),
    })
    .where(and(eq(expense.id, id), eq(expense.userId, session.user.id)))
    .returning();

  if (updatedList.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    .delete(expense)
    .where(and(eq(expense.id, id), eq(expense.userId, session.user.id)))
    .returning();

  if (deletedList.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
