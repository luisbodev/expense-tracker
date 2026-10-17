import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  description: text("description"),
  category: text("category"),
  merchant: text("merchant"),
  spentAt: integer("spent_at").notNull(),
  receiptPath: text("receipt_path"),
  source: text("source").notNull().default("telegram"),
  telegramMessageId: integer("telegram_message_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
