import type { Summary } from "../types";

function money(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

export default function SummaryCards({ summary, monthLabel }: { summary: Summary; monthLabel: string }) {
  const days = new Date().getDate();
  const dailyAvg = summary.count > 0 ? summary.totalCents / days : 0;
  return (
    <div className="cards">
      <div className="card">
        <span className="card-label">Total {monthLabel}</span>
        <span className="card-value">{money(summary.totalCents)}</span>
      </div>
      <div className="card">
        <span className="card-label">Gastos</span>
        <span className="card-value">{summary.count}</span>
      </div>
      <div className="card">
        <span className="card-label">Promedio diario</span>
        <span className="card-value">{money(dailyAvg)}</span>
      </div>
    </div>
  );
}
