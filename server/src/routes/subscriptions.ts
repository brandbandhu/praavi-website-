import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { FREQUENCIES } from "../lib/types.js";
import { getAxisTargetPaise } from "../lib/bucketConfigService.js";

export const subscriptionsRouter = Router();
subscriptionsRouter.use(requireAuth);

subscriptionsRouter.get("/", async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const subs = await prisma.subscriptionMisc.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { name: "asc" },
  });
  res.json(subs);
});

subscriptionsRouter.get("/summary", async (_req, res) => {
  const targetPaise = await getAxisTargetPaise();
  res.json({ targetPaise });
});

const createSchema = z.object({
  name: z.string().min(1),
  amountPaise: z.number().int().positive(),
  frequency: z.enum(FREQUENCIES),
});

subscriptionsRouter.post("/", requireRole("accountant"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const sub = await prisma.subscriptionMisc.create({ data: parsed.data });
  res.status(201).json(sub);
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  amountPaise: z.number().int().positive().optional(),
  frequency: z.enum(FREQUENCIES).optional(),
  active: z.boolean().optional(),
});

subscriptionsRouter.put("/:id", requireRole("accountant"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const existing = await prisma.subscriptionMisc.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Subscription not found" });
  const sub = await prisma.subscriptionMisc.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(sub);
});

subscriptionsRouter.delete("/:id", requireRole("accountant"), async (req, res) => {
  const existing = await prisma.subscriptionMisc.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Subscription not found" });
  await prisma.subscriptionMisc.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
