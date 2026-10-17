# 💸 Expense Tracker

Personal expense tracker. Send a receipt photo + amount via Telegram and it is
saved automatically. Browse, filter, and chart expenses in a local web app.

## Stack

- Server — Node 22 + TypeScript + Fastify + grammY + Drizzle (SQLite via better-sqlite3)
- Web — React 18 + Vite + Recharts (served by nginx)
- Receipt parsing — OpenAI GPT-4o-mini Vision
- Deploy — Docker Compose, runs locally

## Quick start

1. Configure secrets:  cp .env.example .env
2. Fill BOT_TOKEN (Telegram), ALLOWED_TELEGRAM_USER_IDS and OPENAI_API_KEY
3. Build and run:  docker compose up -d --build
4. Open the web app:  http://localhost:8080

## How the Telegram bot works

Send to your bot:

- "25.50 supermercado" logs an expense (no photo)
- A receipt photo with the amount in the caption is logged immediately
- A receipt photo without the amount is read by GPT Vision; if it cannot
  determine the total, the bot asks "¿cuánto fue?" and you reply with the number

Commands: /start, /help, /total (current month total).

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/expenses | List (query: from, to, category, limit, offset) |
| GET | /api/expenses/summary | Totals + by category (query: from, to) |
| POST | /api/expenses | Create |
| GET | /api/expenses/:id | Get one |
| PATCH | /api/expenses/:id | Update |
| DELETE | /api/expenses/:id | Delete |
| GET | /api/categories | Distinct categories |
| GET | /api/receipts/:filename | Receipt image |

from / to are Unix timestamps in milliseconds.

## Data persistence

The SQLite database and receipt images live in the expense-data Docker volume
(/app/data). Back it up with:

    docker run --rm -v expense-tracker_expense-data:/data -v "$PWD":/backup alpine tar czf /backup/expense-backup.tar.gz -C /data .

## Development (without Docker)

Server:  cd server && npm install && npm run dev
Web:     cd web && npm install && npm run dev   → http://localhost:5173
