import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { expenseRepository } from "@/db/repositories";
import { auth } from "@/lib/auth";

const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  note: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseListParams(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search")?.trim() ?? "";
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const usePagination =
    pageParam != null && limitParam != null && limitParam !== "0";
  const page = usePagination ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const limit = usePagination
    ? Math.min(500, Math.max(1, parseInt(limitParam, 10)))
    : 10_000;

  return {
    startDate: startDate && DATE_REGEX.test(startDate) ? startDate : undefined,
    endDate: endDate && DATE_REGEX.test(endDate) ? endDate : undefined,
    search: search || undefined,
    page,
    limit,
    usePagination,
  };
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = parseListParams(request);
  const { rows, total } = await expenseRepository.listFiltered(
    session.user.id,
    params,
  );

  if (params.usePagination) {
    return NextResponse.json({
      data: rows,
      total,
      page: params.page,
      limit: params.limit,
    });
  }
  return NextResponse.json(rows);
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

  const newExpense = await expenseRepository.create({
    id: crypto.randomUUID(),
    userId: session.user.id,
    amount: amountInPaise,
    category,
    note: note ?? null,
    date,
  });

  return NextResponse.json(newExpense);
}
