import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { config } from "../config.js";
import * as schema from "./schema.js";

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
fs.mkdirSync(config.receiptsDir, { recursive: true });

const sqlite = new Database(config.databasePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(
  "CREATE TABLE IF NOT EXISTS expenses (" +
  "id TEXT PRIMARY KEY, " +
  "amount_cents INTEGER NOT NULL, " +
  "currency TEXT NOT NULL DEFAULT 'USD', " +
  "description TEXT, " +
  "category TEXT, " +
  "merchant TEXT, " +
  "spent_at INTEGER NOT NULL, " +
  "receipt_path TEXT, " +
  "source TEXT NOT NULL DEFAULT 'telegram', " +
  "telegram_message_id INTEGER, " +
  "created_at INTEGER NOT NULL, " +
  "updated_at INTEGER NOT NULL" +
  "); " +
  "CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON expenses (spent_at);"
);

export const db = drizzle(sqlite, { schema });
