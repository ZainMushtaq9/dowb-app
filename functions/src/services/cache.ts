import { db, FieldValue } from "../config/firebase.js";

export async function getCached<T>(key: string): Promise<T | null> {
  const snap = await db.collection("cache").doc(key).get();
  if (!snap.exists) return null;
  const expiresAt = snap.get("expiresAt")?.toDate?.() as Date | undefined;
  if (expiresAt && expiresAt.getTime() < Date.now()) return null;
  return snap.get("value") as T;
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number) {
  await db.collection("cache").doc(key).set({
    value,
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000)
  });
}
