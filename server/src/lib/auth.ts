import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "./types.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
