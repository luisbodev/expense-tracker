import "dotenv/config";

function str(name: string, fallback: string): string {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

export const config = {
  port: Number(str("PORT", "3000")),
  botToken: str("BOT_TOKEN", ""),
  openaiApiKey: str("OPENAI_API_KEY", ""),
  openaiModel: str("OPENAI_MODEL", "gpt-4o-mini"),
  databasePath: str("DATABASE_PATH", "./data/expenses.db"),
  receiptsDir: str("RECEIPTS_DIR", "./data/receipts"),
  allowedTelegramUserIds: str("ALLOWED_TELEGRAM_USER_IDS", "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number),
  currency: str("CURRENCY", "USD"),
};
