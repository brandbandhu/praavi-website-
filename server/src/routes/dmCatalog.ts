import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { DEPARTMENTS } from "../lib/types.js";

// ---- Deliverable types (the catalog everything else draws from) ----
export const deliverableTypesRouter = Router();
deliverableTypesRouter.use(requireAuth);

const departmentQuerySchema = z.object({ department: z.enum(DEPARTMENTS).optional() });

deliverableTypesRouter.get("/", async (req, res) => {
  const parsed = departmentQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const includeInactive = req.query.includeInactive === "true";
  const types = await prisma.deliverableType.findMany({
    where: {
      ...(includeInactive ? {} : { active: true }),
      ...(parsed.data.department ? { department: parsed.data.department } : {}),
    },
    orderBy: { sortOrder: "asc" },
  });
  res.json(types);
});

const deliverableTypeSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  department: z.enum(DEPARTMENTS),
});

deliverableTypesRouter.post("/", requireRole("accountant"), async (req, res) => {
  const parsed = deliverableTypeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const count = await prisma.deliverableType.count({ where: { department: parsed.data.department } });
  const type = await prisma.deliverableType.create({ data: { ...parsed.data, sortOrder: count } });
  res.status(201).json(type);
});

const deliverableTypeUpdateSchema = deliverableTypeSchema.partial().extend({ active: z.boolean().optional() });

deliverableTypesRouter.put("/:id", requireRole("accountant"), async (req, res) => {
  const parsed = deliverableTypeUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const existing = await prisma.deliverableType.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Deliverable type not found" });
  const type = await prisma.deliverableType.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(type);
});

deliverableTypesRouter.delete("/:id", requireRole("accountant"), async (req, res) => {
  const existing = await prisma.deliverableType.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Deliverable type not found" });
  await prisma.deliverableType.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---- Quotation packages (the department's presets + any custom ones added later) ----
export const quotationPackagesRouter = Router();
quotationPackagesRouter.use(requireAuth);

function serializePackage(p: any) {
  return { ...p, items: p.items?.sort((a: any, b: any) => a.deliverableType.sortOrder - b.deliverableType.sortOrder) ?? [] };
}

quotationPackagesRouter.get("/", async (req, res) => {
  const parsed = departmentQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const includeInactive = req.query.includeInactive === "true";
  const packages = await prisma.quotationPackage.findMany({
    where: {
      ...(includeInactive ? {} : { active: true }),
      ...(parsed.data.department ? { department: parsed.data.department } : {}),
    },
    orderBy: { sortOrder: "asc" },
    include: { items: { include: { deliverableType: true } } },
  });
  res.json(packages.map(serializePackage));
});

const packageItemSchema = z.object({
  deliverableTypeId: z.string(),
  included: z.boolean(),
  quantity: z.number().int().min(0),
});

const packageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  department: z.enum(DEPARTMENTS),
  defaultPricePaise: z.number().int().positive().optional(),
  items: z.array(packageItemSchema),
});

quotationPackagesRouter.post("/", requireRole("accountant"), async (req, res) => {
  const parsed = packageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const count = await prisma.quotationPackage.count({ where: { department: parsed.data.department } });
  const pkg = await prisma.quotationPackage.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      department: parsed.data.department,
      defaultPricePaise: parsed.data.defaultPricePaise,
      sortOrder: count,
      items: { create: parsed.data.items },
    },
    include: { items: { include: { deliverableType: true } } },
  });
  res.status(201).json(serializePackage(pkg));
});

const packageUpdateSchema = packageSchema.partial().extend({ active: z.boolean().optional() });

quotationPackagesRouter.put("/:id", requireRole("accountant"), async (req, res) => {
  const parsed = packageUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const existing = await prisma.quotationPackage.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Package not found" });

  const pkg = await prisma.$transaction(async (tx) => {
    if (parsed.data.items) {
      await tx.quotationPackageItem.deleteMany({ where: { packageId: req.params.id } });
    }
    return tx.quotationPackage.update({
      where: { id: req.params.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        department: parsed.data.department,
        defaultPricePaise: parsed.data.defaultPricePaise,
        active: parsed.data.active,
        items: parsed.data.items ? { create: parsed.data.items } : undefined,
      },
      include: { items: { include: { deliverableType: true } } },
    });
  });

  res.json(serializePackage(pkg));
});

quotationPackagesRouter.delete("/:id", requireRole("accountant"), async (req, res) => {
  const existing = await prisma.quotationPackage.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Package not found" });
  await prisma.quotationPackage.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
