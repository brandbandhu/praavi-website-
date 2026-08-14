import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../lib/auth.js";
import type { Role } from "../lib/types.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  try {
    req.user = verifyToken(header.slice("Bearer ".length));
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Founder has full access everywhere; other roles are checked explicitly.
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (req.user.role === "founder" || roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: "You don't have permission to do this" });
  };
}
