import type { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function requestId(req: Request, _res: Response, next: NextFunction) {
  req.headers["x-request-id"] ||= nanoid(12);
  next();
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : "Unknown server error";
  const status = message.includes("rate limit") ? 429 : 500;
  res.status(status).json({ error: message });
}
