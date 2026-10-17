import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Summary } from "../types";

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];

export default function CategoryChart({ summary }: { summary: Summary }) {
  const data = summary.byCategory
    .filter((c) => (c.total ?? 0) > 0)
    .map((c) => ({ name: c.category ?? "sin categoría", value: c.total / 100 }));

  if (data.length === 0) {
    return <div className="empty">Sin datos para este mes.</div>;
  }

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => "$" + Number(value).toFixed(2)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
