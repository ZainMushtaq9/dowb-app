import { AlertPayload } from "@tiktok-downloader/shared";
import { request } from "undici";
import { env } from "../config/env.js";
import { db, FieldValue } from "../config/firebase.js";

export async function sendAlert(alert: AlertPayload) {
  await db.collection("alerts").add({
    ...alert,
    createdAt: FieldValue.serverTimestamp()
  });

  const text = [
    alert.severity === "critical" ? "CRITICAL Downloader Alert" : "Downloader Alert",
    `Source: ${alert.source}`,
    `Title: ${alert.title}`,
    `Message: ${alert.message}`,
    alert.affectedUsers ? `Affected Users: ${alert.affectedUsers}` : undefined
  ]
    .filter(Boolean)
    .join("\n");

  if (env.telegramBotToken && env.telegramChatId) {
    await request(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
      method: "POST",
      body: JSON.stringify({ chat_id: env.telegramChatId, text }),
      headers: { "content-type": "application/json" }
    }).catch(() => undefined);
  }

  if (env.alertEmailWebhookUrl) {
    await request(env.alertEmailWebhookUrl, {
      method: "POST",
      body: JSON.stringify({ subject: alert.title, text, alert }),
      headers: { "content-type": "application/json" }
    }).catch(() => undefined);
  }
}
