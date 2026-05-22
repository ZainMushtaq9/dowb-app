import type { Request, Response, NextFunction } from "express";
import { FieldValue, db } from "../config/firebase.js";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = String(req.headers["x-forwarded-for"] || req.ip || "unknown").split(",")[0].trim();
  const bucket = Math.floor(Date.now() / WINDOW_MS);
  const ref = db.collection("rateLimits").doc(`${ip}:${bucket}`);
  const snap = await ref.get();
  const count = Number(snap.get("count") || 0);

  if (count >= MAX_REQUESTS) {
    res.status(429).json({ error: "Temporary rate limit reached. Please retry shortly." });
    return;
  }

  await ref.set(
    {
      ip,
      bucket,
      count: FieldValue.increment(1),
      expiresAt: new Date(Date.now() + WINDOW_MS * 2)
    },
    { merge: true }
  );
  next();
}
