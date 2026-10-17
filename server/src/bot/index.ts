import { Bot } from "grammy";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { createExpense, getSummary, type Expense } from "../services/expenses.js";
import { parseReceipt, type ParsedReceipt } from "../parser/vision.js";

type Pending = {
  receiptPath: string | null;
  parsed: ParsedReceipt | null;
  description: string | null;
};

export function startBot(): Bot | null {
  if (!config.botToken) {
    console.warn("⚠️  BOT_TOKEN not set — Telegram bot disabled.");
    return null;
  }

  const bot = new Bot(config.botToken);
  const pending = new Map<number, Pending>();

  bot.use(async (ctx, next) => {
    const uid = ctx.from ? ctx.from.id : undefined;
    if (config.allowedTelegramUserIds.length > 0) {
      if (uid === undefined || !config.allowedTelegramUserIds.includes(uid)) {
        await ctx.reply("⛔ No tienes permiso para usar este bot.");
        return;
      }
    }
    await next();
  });

  bot.command("start", async (ctx) => {
    await ctx.reply("👋 ¡Hola! Envíame una foto de tu ticket junto con el monto (ej: 25.50) y lo guardo automáticamente.");
  });

  bot.command("help", async (ctx) => {
    await ctx.reply("Envía una foto + monto (ej: 25.50 supermercado), o solo el monto (ej: 12.30 almuerzo). /total para ver el total del mes.");
  });

  bot.command("total", async (ctx) => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - 1;
    const summary = getSummary({ from, to });
    await ctx.reply("💸 Este mes: $" + (summary.totalCents / 100).toFixed(2) + " en " + summary.count + " gastos.");
  });

  bot.on("message", async (ctx) => {
    const msg = ctx.message;
    if (!msg) return;
    const uid = ctx.from ? ctx.from.id : ctx.chat.id;
    const text = msg.text ?? msg.caption ?? "";
    const photo = msg.photo ? msg.photo[msg.photo.length - 1] : null;
    const amountCents = parseAmount(text);
    const pendingEntry = pending.get(uid);

    // Case 1: user replies with an amount to complete a pending receipt
    if (!photo && amountCents !== null && pendingEntry) {
      pending.delete(uid);
      const exp = createExpense({
        amountCents,
        currency: config.currency,
        description: pendingEntry.description,
        category: pendingEntry.parsed ? pendingEntry.parsed.category : null,
        merchant: pendingEntry.parsed ? pendingEntry.parsed.merchant : null,
        spentAt: pendingEntry.parsed && pendingEntry.parsed.date ? safeDate(pendingEntry.parsed.date) : Date.now(),
        receiptPath: pendingEntry.receiptPath,
        source: "telegram",
        telegramMessageId: msg.message_id,
      });
      await ctx.reply(formatConfirmation(exp));
      return;
    }

    // Case 2: message includes a photo
    if (photo) {
      let receiptPath: string | null = null;
      let parsed: ParsedReceipt | null = null;
      try {
        receiptPath = await downloadPhoto(ctx, photo.file_id);
      } catch (e) {
        console.error("download failed", e);
      }
      if (receiptPath && config.openaiApiKey && amountCents === null) {
        try {
          parsed = await parseReceipt(path.join(config.receiptsDir, receiptPath));
        } catch (e) {
          console.error("vision failed", e);
        }
      }

      const finalAmount = amountCents !== null ? amountCents : (parsed ? parsed.amountCents : null);
      if (finalAmount !== null) {
        const exp = createExpense({
          amountCents: finalAmount,
          currency: config.currency,
          description: text.trim() || (parsed ? parsed.description : null) || null,
          category: parsed ? parsed.category : null,
          merchant: parsed ? parsed.merchant : null,
          spentAt: parsed && parsed.date ? safeDate(parsed.date) : Date.now(),
          receiptPath,
          source: "telegram",
          telegramMessageId: msg.message_id,
        });
        await ctx.reply(formatConfirmation(exp));
      } else {
        pending.set(uid, { receiptPath, parsed, description: descriptionFromText(text) });
        await ctx.reply("📷 Recibí el ticket pero no pude leer el total. ¿Cuánto fue? (ej: 25.50)");
      }
      return;
    }

    // Case 3: text-only message
    if (text.trim()) {
      if (amountCents !== null) {
        const exp = createExpense({
          amountCents,
          currency: config.currency,
          description: descriptionFromText(text),
          source: "telegram",
          telegramMessageId: msg.message_id,
        });
        await ctx.reply(formatConfirmation(exp));
      } else {
        await ctx.reply("Para registrar un gasto, envíame el monto (ej: 25.50) y opcionalmente una foto del ticket.");
      }
    }
  });

  bot.catch((err) => console.error("bot error:", err));

  bot.start({
    onStart: (me) => console.log("🤖 Bot @" + me.username + " activo (long polling)"),
    drop_pending_updates: true,
  });

  return bot;
}

function parseAmount(text: string): number | null {
  const matches = Array.from(text.matchAll(/([0-9]+(?:[.,][0-9]{1,2})?)/g)).map((m) => m[1]);
  if (matches.length === 0) return null;
  const withDec = matches.filter((m) => m.indexOf(".") >= 0 || m.indexOf(",") >= 0);
  const chosen = withDec.length > 0 ? withDec[withDec.length - 1] : matches[matches.length - 1];
  const n = parseFloat(chosen.replace(",", "."));
  if (isNaN(n)) return null;
  return Math.round(n * 100);
}

function descriptionFromText(text: string): string | null {
  const words = text.trim().split(" ").filter(Boolean);
  if (words.length <= 1) return null;
  return words.slice(1).join(" ");
}

function safeDate(iso: string): number {
  const t = Date.parse(iso);
  return isNaN(t) ? Date.now() : t;
}

function formatConfirmation(exp: Expense): string {
  let msg = "✅ Guardado: $" + (exp.amountCents / 100).toFixed(2);
  if (exp.merchant) msg += " — " + exp.merchant;
  if (exp.category) msg += " (" + exp.category + ")";
  return msg;
}

async function downloadPhoto(ctx: any, fileId: string): Promise<string> {
  const file = await ctx.api.getFile(fileId);
  if (!file.file_path) throw new Error("no file_path");
  const url = "https://api.telegram.org/file/bot" + config.botToken + "/" + file.file_path;
  const ext = path.extname(file.file_path) || ".jpg";
  const filename = String(Date.now()) + "-" + randomUUID() + ext;
  const dest = path.join(config.receiptsDir, filename);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("telegram download " + resp.status);
  const buf = Buffer.from(await resp.arrayBuffer());
  await fs.writeFile(dest, buf);
  return filename;
}
