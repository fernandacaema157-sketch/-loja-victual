import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.SESSION_SECRET ?? "jersey-store-secret-key";
export const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function requireAuth(req: Request & { userId?: string; jwtPayload?: JwtPayload }, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId = String(payload.userId);
    req.jwtPayload = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(req: Request & { userId?: string; jwtPayload?: JwtPayload }, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId = String(payload.userId);
    req.jwtPayload = payload;

    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (payload.isAdmin || ADMIN_EMAILS.includes(payload.email.toLowerCase())) {
      next();
      return;
    }

    res.status(403).json({ error: "Forbidden" });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
