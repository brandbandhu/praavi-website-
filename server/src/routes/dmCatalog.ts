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
  const normalizedItems = await normalizePackageItems(parsed.data.items);
  const pkg = await prisma.quotationPackage.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      department: parsed.data.department,
      defaultPricePaise: parsed.data.defaultPricePaise,
      sortOrder: count,
      items: { create: normalizedItems },
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
  const normalizedItems = parsed.data.items
    ? await normalizePackageItems(parsed.data.items)
    : undefined;
  if (parsed.data.items) {
    const includedCount = normalizedItems!.filter((item) => item.included).length;
    console.log(
      `[quotation-packages] saving ${req.params.id}: ${includedCount}/${normalizedItems!.length} items included`
    );
  }

  const pkg = await prisma.$transaction(async (tx) => {
    if (normalizedItems) {
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
        items: normalizedItems ? { create: normalizedItems } : undefined,
      },
      include: { items: { include: { deliverableType: true } } },
    });
  });

  res.json(serializePackage(pkg));
});

async function normalizePackageItems(items: z.infer<typeof packageItemSchema>[]) {
  const deliverableTypeIds = [...new Set(items.map((item) => item.deliverableTypeId))];
  const deliverableTypes = await prisma.deliverableType.findMany({ where: { id: { in: deliverableTypeIds } } });
  const unitById = new Map(deliverableTypes.map((type) => [type.id, type.unit]));

  return items.map((item) => ({
    ...item,
    quantity: !item.included
      ? 0
      : unitById.get(item.deliverableTypeId) !== "included" && item.quantity <= 0
        ? 1
        : item.quantity,
  }));
}

quotationPackagesRouter.delete("/:id", requireRole("accountant"), async (req, res) => {
  const existing = await prisma.quotationPackage.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Package not found" });
  await prisma.quotationPackage.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
