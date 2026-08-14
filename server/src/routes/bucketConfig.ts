import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import {
  createBucketConfigVersion,
  getAxisTargetPaise,
  getBucketConfigAsOf,
  getCurrentBucketConfig,
  getSalaryPoolRequiredPaise,
  setBucketDueDay,
} from "../lib/bucketConfigService.js";
import { BUCKET_LABELS, BUCKET_NAMES, BUCKET_ROUTES_TO, type BucketName } from "../lib/types.js";

export const bucketConfigRouter = Router();
bucketConfigRouter.use(requireAuth);

async function resolveTargetPaise(
  bucketName: BucketName,
  fixedMonthlyTargetPaise: number | null
): Promise<number | null> {
  if (bucketName === "salary_pool") return getSalaryPoolRequiredPaise();
  if (bucketName === "axis") return getAxisTargetPaise();
  return fixedMonthlyTargetPaise;
}

bucketConfigRouter.get("/current", async (_req, res) => {
  const config = await getCurrentBucketConfig();
  const entries = await Promise.all(
    config.entries.map(async (e) => ({
      bucketName: e.bucketName,
      label: BUCKET_LABELS[e.bucketName],
      routesTo: BUCKET_ROUTES_TO[e.bucketName],
      percentageBps: e.percentageBps,
      percent: e.percentageBps / 100,
      fixedMonthlyTargetPaise: await resolveTargetPaise(e.bucketName, e.fixedMonthlyTargetPaise),
      fixedMonthlyTargetMinPaise: e.fixedMonthlyTargetMinPaise,
      fixedMonthlyTargetMaxPaise: e.fixedMonthlyTargetMaxPaise,
      dueDay: e.dueDay,
    }))
  );
  res.json({ versionId: config.versionId, effectiveFrom: config.effectiveFrom, entries });
});

bucketConfigRouter.get("/history", async (_req, res) => {
  const versions = await prisma.bucketConfigVersion.findMany({
    orderBy: { effectiveFrom: "desc" },
    include: { entries: true },
  });
  res.json(
    versions.map((v) => ({
      versionId: v.id,
      effectiveFrom: v.effectiveFrom,
      createdAt: v.createdAt,
      entries: v.entries.map((e) => ({
        bucketName: e.bucketName,
        percentageBps: e.percentageBps,
        percent: e.percentageBps / 100,
      })),
    }))
  );
});

bucketConfigRouter.get("/as-of/:date", async (req, res) => {
  const date = new Date(req.params.date);
  if (isNaN(date.getTime())) return res.status(400).json({ error: "Invalid date" });
  const config = await getBucketConfigAsOf(date);
  res.json({
    versionId: config.versionId,
    effectiveFrom: config.effectiveFrom,
    entries: config.entries.map((e) => ({ bucketName: e.bucketName, percent: e.percentageBps / 100 })),
  });
});

const entrySchema = z.object({
  bucketName: z.enum(BUCKET_NAMES),
  percent: z.number().min(0).max(100),
  fixedMonthlyTargetPaise: z.number().nullable().optional(),
  fixedMonthlyTargetMinPaise: z.number().nullable().optional(),
  fixedMonthlyTargetMaxPaise: z.number().nullable().optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
});

const updateSchema = z.object({
  entries: z.array(entrySchema).length(BUCKET_NAMES.length),
  effectiveFrom: z.string().optional(), // defaults to now
});

// Founder only: publish a new bucket_config version. Percentages must sum to
// exactly 100%, validated both here (nice error) and again inside the
// service (source of truth).
bucketConfigRouter.post("/", requireRole("founder"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const totalPercent = parsed.data.entries.reduce((s, e) => s + e.percent, 0);
  if (Math.round(totalPercent * 100) !== 10000) {
    return res.status(400).json({
      error: `Percentages must sum to exactly 100%. Currently ${totalPercent.toFixed(2)}%.`,
      totalPercent,
    });
  }

  try {
    const version = await createBucketConfigVersion(
      parsed.data.entries.map((e) => ({
        bucketName: e.bucketName,
        percentageBps: Math.round(e.percent * 100),
        fixedMonthlyTargetPaise: e.fixedMonthlyTargetPaise,
        fixedMonthlyTargetMinPaise: e.fixedMonthlyTargetMinPaise,
        fixedMonthlyTargetMaxPaise: e.fixedMonthlyTargetMaxPaise,
        dueDay: e.dueDay,
      })),
      parsed.data.effectiveFrom ? new Date(parsed.data.effectiveFrom) : new Date(),
      req.user!.userId
    );
    res.status(201).json(version);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const dueDaySchema = z.object({ dueDay: z.number().int().min(1).max(31).nullable() });

// Lightweight metadata edit — doesn't need a new effective-dated version
// since it's not part of the money-routing formula.
bucketConfigRouter.patch("/:bucketName/due-day", requireRole("founder"), async (req, res) => {
  if (!BUCKET_NAMES.includes(req.params.bucketName as any)) {
    return res.status(400).json({ error: "Invalid bucket name" });
  }
  const parsed = dueDaySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  await setBucketDueDay(req.params.bucketName as BucketName, parsed.data.dueDay);
  res.json({ ok: true });
});
