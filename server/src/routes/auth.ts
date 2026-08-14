import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { hashPassword, signToken, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { ROLES } from "../lib/types.js";

export const authRouter = Router();

const bootstrapUsers = [
  {
    id: "user-admin-malhar",
    email: process.env.FMS_ADMIN_USERNAME,
    password: process.env.FMS_ADMIN_PASSWORD,
    name: "Malhar Pandey",
    role: "founder",
  },
  {
    id: "user-finance-sakshi",
    email: process.env.FMS_FINANCE_USERNAME,
    password: process.env.FMS_FINANCE_PASSWORD,
    name: "Sakshi Finance",
    role: "accountant",
  },
] as const;

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid username or password" });

    const username = parsed.data.email.trim();
    const user = await prisma.user.findUnique({ where: { email: username } });
    const bootstrapUser = bootstrapUsers.find(
      (u) => u.email && u.password && u.email === username && u.password === parsed.data.password
    );

    if (!user && bootstrapUser) {
      const token = signToken({
        userId: bootstrapUser.id,
        email: bootstrapUser.email!,
        name: bootstrapUser.name,
        role: bootstrapUser.role,
      });
      return res.json({
        token,
        user: { id: bootstrapUser.id, email: bootstrapUser.email!, name: bootstrapUser.name, role: bootstrapUser.role },
      });
    }

    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    try {
      await prisma.loginLog.create({
        data: { userId: user.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] },
      });
    } catch (err) {
      console.error("Failed to write login log:", err);
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role as any });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// Founder-only: create additional user accounts (there's no public signup —
// this is an internal tool for under 5 people).
const createUserSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(ROLES),
});

authRouter.post("/users", requireAuth, async (req, res, next) => {
  try {
    if (req.user!.role !== "founder") return res.status(403).json({ error: "Founder only" });
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.trim() } });
    if (existing) return res.status(409).json({ error: "A user with that email already exists" });

    const user = await prisma.user.create({
      data: {
        email: parsed.data.email.trim(),
        passwordHash: hashPassword(parsed.data.password),
        name: parsed.data.name,
        role: parsed.data.role,
      },
    });
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    next(err);
  }
});
