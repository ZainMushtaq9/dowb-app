import admin from "firebase-admin";
import { env } from "./env.js";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
