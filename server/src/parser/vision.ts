import OpenAI from "openai";
import fs from "node:fs";
import { config } from "../config.js";

export interface ParsedReceipt {
  amountCents: number | null;
  merchant: string | null;
  date: string | null;
  category: string | null;
  description: string | null;
}

const CATEGORIES = ["food", "groceries", "transport", "health", "entertainment", "utilities", "shopping", "other"];

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: config.openaiApiKey });
  return _openai;
}

export async function parseReceipt(imagePath: string): Promise<ParsedReceipt> {
  const imageB64 = fs.readFileSync(imagePath).toString("base64");
  const prompt = 'You are a receipt parser. Extract from the receipt image the total amount (final total), the merchant/store name, the purchase date (ISO yyyy-mm-dd), a short description, and the most appropriate category from: ' + CATEGORIES.join(", ") + '. Respond ONLY with JSON, for example: {"amount": 12.34, "merchant": "Walmart", "date": "2026-10-17", "category": "groceries", "description": "groceries"}. Use null for any field you cannot find.';

  const resp = await getOpenAI().chat.completions.create({
    model: config.openaiModel,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: "data:image/jpeg;base64," + imageB64 } },
        ],
      },
    ],
    max_tokens: 300,
    temperature: 0,
  });

  const raw = resp.choices[0]?.message?.content ?? "";
  const parsed = extractJson(raw);
  const amount = typeof parsed.amount === "number" ? parsed.amount : null;
  return {
    amountCents: amount !== null ? Math.round(amount * 100) : null,
    merchant: typeof parsed.merchant === "string" ? parsed.merchant : null,
    date: typeof parsed.date === "string" ? parsed.date : null,
    category: typeof parsed.category === "string" ? parsed.category : null,
    description: typeof parsed.description === "string" ? parsed.description : null,
  };
}

function extractJson(raw: string): any {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON in vision response");
  return JSON.parse(trimmed.slice(start, end + 1));
}
