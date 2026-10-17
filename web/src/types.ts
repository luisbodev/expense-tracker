export interface Expense {
  id: string;
  amountCents: number;
  currency: string;
  description: string | null;
  category: string | null;
  merchant: string | null;
  spentAt: number;
  receiptPath: string | null;
  source: string;
  telegramMessageId: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Summary {
  totalCents: number;
  count: number;
  byCategory: Array<{ category: string | null; total: number; count: number }>;
}
