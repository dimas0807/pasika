/**
 * Telegram Logger Module
 * Persists Telegram events, notifications, errors and interactions in SQLite
 */

import crypto from "node:crypto";
import { db } from "../../db.js";

/**
 * Log a Telegram notification or event
 */
export function logTelegramEvent({
  orderId = null,
  recipientId = null,
  chatId = null,
  text,
  status, // 'SENT', 'FAILED', 'DISABLED', 'SIMULATED', 'UNAUTHORIZED', 'ACTION_PROCESSED'
  responseData = null,
}) {
  try {
    const id = "tg_" + Date.now().toString(36) + "_" + crypto.randomBytes(3).toString("hex");
    const now = Date.now();

    const cleanResponseData =
      responseData && typeof responseData === "object"
        ? JSON.stringify(responseData)
        : typeof responseData === "string"
        ? responseData
        : null;

    db.prepare(`
      INSERT INTO telegram_logs (
        id, order_id, recipient_id, chat_id, text, status, response_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      orderId,
      recipientId,
      chatId ? String(chatId) : null,
      String(text || "").slice(0, 4000),
      String(status || "UNKNOWN"),
      cleanResponseData,
      now
    );

    return { id, status, created_at: now };
  } catch (err) {
    console.error("[Telegram Logger Error]:", err.message);
    return null;
  }
}

/**
 * Get recent Telegram logs for admin panel
 */
export function getTelegramLogs(limit = 20) {
  const cleanLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  try {
    return db
      .prepare(`
        SELECT id, order_id, recipient_id, chat_id, text, status, response_data, created_at
        FROM telegram_logs
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(cleanLimit);
  } catch (err) {
    console.error("[Telegram Logger Fetch Error]:", err.message);
    return [];
  }
}
