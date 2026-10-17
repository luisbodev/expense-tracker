import type { Expense, Summary } from "./types";

const BASE = "/api";

async function http<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error("HTTP " + res.status + ": " + body);
  }
  return res.json() as Promise<T>;
}

export function listExpenses(params?: { from?: number; to?: number; category?: string }): Promise<Expense[]> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", String(params.from));
  if (params?.to) qs.set("to", String(params.to));
  if (params?.category) qs.set("category", params.category);
  const q = qs.toString();
  return http("/expenses" + (q ? "?" + q : ""));
}

export function getSummary(params?: { from?: number; to?: number }): Promise<Summary> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", String(params.from));
  if (params?.to) qs.set("to", String(params.to));
  const q = qs.toString();
  return http("/expenses/summary" + (q ? "?" + q : ""));
}

export function createExpense(input: Partial<Expense>): Promise<Expense> {
  return http("/expenses", { method: "POST", body: JSON.stringify(input) });
}

export function updateExpense(id: string, patch: Partial<Expense>): Promise<Expense> {
  return http("/expenses/" + id, { method: "PATCH", body: JSON.stringify(patch) });
}

export function deleteExpense(id: string): Promise<{ ok: boolean }> {
  return http("/expenses/" + id, { method: "DELETE" });
}
