import type { FastifyInstance } from "fastify";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import * as svc from "../services/expenses.js";

const createSchema = z.object({
  amountCents: z.number().int().min(0),
  currency: z.string().optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  merchant: z.string().nullable().optional(),
  spentAt: z.number().optional(),
  source: z.string().optional(),
});

const patchSchema = z.object({
  amountCents: z.number().int().min(0),
  currency: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  merchant: z.string().nullable(),
  spentAt: z.number(),
}).partial();

export function registerRoutes(app: FastifyInstance): void {
  app.addHook("onRequest", async (req, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return reply.send();
  });

  app.get("/api/health", async () => ({ ok: true, time: Date.now() }));

  app.get("/api/expenses", async (req) => {
    const q = req.query as Record<string, string | undefined>;
    return svc.listExpenses({
      from: q.from ? Number(q.from) : undefined,
      to: q.to ? Number(q.to) : undefined,
      category: q.category,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
    });
  });

  app.get("/api/expenses/summary", async (req) => {
    const q = req.query as Record<string, string | undefined>;
    return svc.getSummary({
      from: q.from ? Number(q.from) : undefined,
      to: q.to ? Number(q.to) : undefined,
    });
  });

  app.get("/api/expenses/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const exp = svc.getExpense(id);
    if (!exp) return reply.code(404).send({ error: "not found" });
    return exp;
  });

  app.post("/api/expenses", async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const exp = svc.createExpense(parsed.data);
    return reply.code(201).send(exp);
  });

  app.patch("/api/expenses/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const exp = svc.updateExpense(id, parsed.data);
    if (!exp) return reply.code(404).send({ error: "not found" });
    return exp;
  });

  app.delete("/api/expenses/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = svc.deleteExpense(id);
    if (!ok) return reply.code(404).send({ error: "not found" });
    return { ok: true };
  });

  app.get("/api/categories", async () => svc.listCategories());

  app.get("/api/receipts/:filename", async (req, reply) => {
    const { filename } = req.params as { filename: string };
    const safe = path.basename(filename);
    const full = path.join(config.receiptsDir, safe);
    if (!fs.existsSync(full)) return reply.code(404).send({ error: "not found" });
    const buf = fs.readFileSync(full);
    const ext = path.extname(safe).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return reply.type(mime).send(buf);
  });
}
