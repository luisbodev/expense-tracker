import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { expenses, type Expense, type NewExpense } from "../db/schema.js";
import { and, count, desc, eq, gte, lte, sum } from "drizzle-orm";

export type { Expense, NewExpense } from "../db/schema.js";

export function createExpense(input: {
  amountCents: number;
  currency?: string;
  description?: string | null;
  category?: string | null;
  merchant?: string | null;
  spentAt?: number;
  receiptPath?: string | null;
  source?: string;
  telegramMessageId?: number | null;
}): Expense {
  const now = Date.now();
  const row: NewExpense = {
    id: randomUUID(),
    amountCents: input.amountCents,
    currency: input.currency ?? "USD",
    description: input.description ?? null,
    category: input.category ?? null,
    merchant: input.merchant ?? null,
    spentAt: input.spentAt ?? now,
    receiptPath: input.receiptPath ?? null,
    source: input.source ?? "telegram",
    telegramMessageId: input.telegramMessageId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(expenses).values(row).run();
  return row as Expense;
}

export function getExpense(id: string): Expense | null {
  return db.select().from(expenses).where(eq(expenses.id, id)).get() ?? null;
}

export function listExpenses(opts: {
  from?: number;
  to?: number;
  category?: string;
  limit?: number;
  offset?: number;
}): Expense[] {
  return db.select()
    .from(expenses)
    .where(and(
      opts.from !== undefined ? gte(expenses.spentAt, opts.from) : undefined,
      opts.to !== undefined ? lte(expenses.spentAt, opts.to) : undefined,
      opts.category ? eq(expenses.category, opts.category) : undefined,
    ))
    .orderBy(desc(expenses.spentAt))
    .limit(opts.limit ?? 100)
    .offset(opts.offset ?? 0)
    .all();
}

export function getSummary(opts: { from?: number; to?: number }): {
  totalCents: number;
  count: number;
  byCategory: Array<{ category: string | null; total: number; count: number }>;
} {
  const where = and(
    opts.from !== undefined ? gte(expenses.spentAt, opts.from) : undefined,
    opts.to !== undefined ? lte(expenses.spentAt, opts.to) : undefined,
  );
  const totalRow = db.select({
    total: sum(expenses.amountCents),
    count: count(),
  }).from(expenses).where(where).get();

  const byCategory = db.select({
    category: expenses.category,
    total: sum(expenses.amountCents),
    count: count(),
  }).from(expenses).where(where).groupBy(expenses.category).orderBy(desc(sum(expenses.amountCents))).all();

  return {
    totalCents: Number(totalRow?.total ?? 0),
    count: totalRow?.count ?? 0,
    byCategory: byCategory.map((r) => ({
      category: r.category,
      total: Number(r.total ?? 0),
      count: r.count,
    })),
  };
}

export function updateExpense(id: string, patch: Partial<NewExpense>): Expense | null {
  const existing = getExpense(id);
  if (!existing) return null;
  const safe: any = { ...patch, updatedAt: Date.now() };
  delete safe.id;
  delete safe.createdAt;
  db.update(expenses).set(safe).where(eq(expenses.id, id)).run();
  return getExpense(id);
}

export function deleteExpense(id: string): boolean {
  const existing = getExpense(id);
  if (!existing) return false;
  db.delete(expenses).where(eq(expenses.id, id)).run();
  return true;
}

export function listCategories(): string[] {
  const rows = db.selectDistinct({ category: expenses.category }).from(expenses).all();
  return rows.map((r) => r.category).filter((c): c is string => !!c).sort();
}
