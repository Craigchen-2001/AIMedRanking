// backend/src/middlewares/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = { id: string; email: string; name: string };

declare module "express-serve-static-core" {
  interface Request {
    authUser?: AuthUser;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token || "";
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.authUser = payload;
    next();
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
}
