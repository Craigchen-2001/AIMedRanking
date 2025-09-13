// backend/src/routes/auth.ts
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const COOKIE_SECURE = process.env.NODE_ENV === "production";

function issueCookie(res: any, user: { id: string; email: string; name: string }) {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600 * 1000,
  });
}

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: "invalid_input" });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "email_exists" });
  const hash = await bcrypt.hash(password, 10);
  const u = await prisma.user.create({ data: { email, name, passwordHash: hash } });
  issueCookie(res, { id: u.id, email: u.email, name: u.name });
  res.json({ id: u.id, email: u.email, name: u.name });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "invalid_input" });
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) return res.status(401).json({ error: "invalid_credentials" });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });
  issueCookie(res, { id: u.id, email: u.email, name: u.name });
  res.json({ id: u.id, email: u.email, name: u.name });
});

router.post("/logout", async (_req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: COOKIE_SECURE, sameSite: "lax", path: "/" });
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token || "";
    if (!token) return res.json({ user: null, favoriteIds: [] });
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.json({ user: null, favoriteIds: [] });
    const favs = await prisma.favorite.findMany({ where: { userId: user.id }, select: { paperId: true } });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, favoriteIds: favs.map(f => f.paperId) });
  } catch {
    res.json({ user: null, favoriteIds: [] });
  }
});

export default router;
