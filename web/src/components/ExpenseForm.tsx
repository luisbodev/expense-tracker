import { useState, type FormEvent } from "react";

const CATEGORIES = ["food", "groceries", "transport", "health", "entertainment", "utilities", "shopping", "other"];

export interface ExpenseInput {
  amount: number;
  description: string | null;
  category: string;
  merchant: string | null;
  spentAt: number;
}

export default function ExpenseForm({ onSubmit }: { onSubmit: (input: ExpenseInput) => void }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  function submit(e: FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    onSubmit({
      amount: amt,
      description: description.trim() ? description.trim() : null,
      category,
      merchant: merchant.trim() ? merchant.trim() : null,
      spentAt: new Date(date).getTime() || Date.now(),
    });
    setAmount("");
    setDescription("");
    setMerchant("");
  }

  return (
    <form className="form" onSubmit={submit}>
      <input type="number" step="0.01" min="0" placeholder="Monto (USD)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <input type="text" placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input type="text" placeholder="Comercio" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <button type="submit" className="btn-primary">Agregar</button>
    </form>
  );
}
