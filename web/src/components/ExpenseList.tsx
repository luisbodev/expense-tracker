import type { Expense } from "../types";

function money(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString("es-SV", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ExpenseList({ expenses, onDelete }: { expenses: Expense[]; onDelete: (id: string) => void }) {
  if (expenses.length === 0) {
    return <div className="empty">Aún no hay gastos. Envíalos por Telegram o agrégalos aquí.</div>;
  }
  return (
    <div className="list">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Comercio</th>
            <th>Categoría</th>
            <th className="right">Monto</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{fmtDate(e.spentAt)}</td>
              <td>{e.description ?? "—"}</td>
              <td>{e.merchant ?? "—"}</td>
              <td><span className="pill">{e.category ?? "—"}</span></td>
              <td className="right">{money(e.amountCents)}</td>
              <td className="actions">
                {e.receiptPath && (
                  <a className="btn-ghost" href={"/api/receipts/" + encodeURIComponent(e.receiptPath)} target="_blank" rel="noreferrer">🧾</a>
                )}
                <button className="btn-ghost danger" onClick={() => onDelete(e.id)}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
