import { useCallback, useEffect, useMemo, useState } from "react";
import type { Expense, Summary } from "./types";
import * as api from "./api";
import SummaryCards from "./components/SummaryCards";
import CategoryChart from "./components/CategoryChart";
import ExpenseList from "./components/ExpenseList";
import ExpenseForm from "./components/ExpenseForm";

function monthRange(monthStr: string): { from: number; to: number; label: string } {
  const parts = monthStr.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const from = new Date(y, m - 1, 1).getTime();
  const to = new Date(y, m, 1).getTime() - 1;
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-SV", { month: "long", year: "numeric" });
  return { from, to, label };
}

export default function App() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalCents: 0, count: 0, byCategory: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => monthRange(month), [month]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [exps, sum] = await Promise.all([
        api.listExpenses({ from: range.from, to: range.to }),
        api.getSummary({ from: range.from, to: range.to }),
      ]);
      setExpenses(exps);
      setSummary(sum);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(input: { amount: number; description: string | null; category: string; merchant: string | null; spentAt: number }) {
    await api.createExpense({
      amountCents: Math.round(input.amount * 100),
      description: input.description,
      category: input.category,
      merchant: input.merchant,
      spentAt: input.spentAt,
      source: "web",
    });
    load();
  }

  async function handleDelete(id: string) {
    await api.deleteExpense(id);
    load();
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>💸 Expense Tracker</h1>
        <div className="month-picker">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn-ghost" onClick={load} disabled={loading}>↻</button>
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      <SummaryCards summary={summary} monthLabel={range.label} />
      <main className="grid">
        <section className="panel">
          <h2>Por categoría</h2>
          <CategoryChart summary={summary} />
        </section>
        <section className="panel">
          <h2>Agregar gasto</h2>
          <ExpenseForm onSubmit={handleAdd} />
        </section>
      </main>
      <section className="panel">
        <h2>Gastos {range.label}</h2>
        {loading ? <div className="empty">Cargando…</div> : <ExpenseList expenses={expenses} onDelete={handleDelete} />}
      </section>
    </div>
  );
}
