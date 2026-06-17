import jwt from "jsonwebtoken";
import { type RequestHandler } from "express";

const JWT_SECRET = process.env.SESSION_SECRET || "dev-jwt-secret-change-in-prod";

export interface JwtPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export const requireAuth: RequestHandler = (req: any, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }
  req.userId = String(payload.userId);
  req.userIdNum = payload.userId;
  req.userEmail = payload.email;
  req.userIsAdmin = payload.isAdmin;
  next();
};

export const requireAdmin: RequestHandler = (req: any, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }
  if (!payload.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  req.userId = String(payload.userId);
  req.userIdNum = payload.userId;
  req.userEmail = payload.email;
  req.userIsAdmin = payload.isAdmin;
  next();
};
