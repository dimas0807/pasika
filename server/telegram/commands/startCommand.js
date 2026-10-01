/**
 * Telegram Commands Module
 * Handles /start command and tracks interactions for the admin panel
 */

import crypto from "node:crypto";
import { db } from "../../db.js";
import { sendMessage } from "../client/botApi.js";
import { getTelegramRecipientByChatId } from "../recipients/recipientsManager.js";

/**
 * Record incoming bot interaction in SQLite telegram_interactions
 */
export function recordTelegramInteraction({
  chat_id,
  username,
  first_name,
  last_name,
  action = "start",
  payload = null,
}) {
  try {
    const id = "ti_" + Date.now().toString(36) + "_" + crypto.randomBytes(3).toString("hex");
    const cleanUsername = username
      ? username.startsWith("@")
        ? username
        : "@" + username
      : null;
    const now = Date.now();

    db.prepare(`
      INSERT INTO telegram_interactions (id, chat_id, username, first_name, last_name, action, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(chat_id),
      cleanUsername,
      first_name || null,
      last_name || null,
      action,
      payload ? JSON.stringify(payload) : null,
      now
    );

    return { id, chat_id, action, created_at: now };
  } catch (err) {
    console.error("[Telegram Interaction Record Error]:", err.message);
    return null;
  }
}

/**
 * Fetch recent /start interaction requests for admin panel
 */
export function getRecentTelegramInteractions(limit = 10) {
  const cleanLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  try {
    const rows = db.prepare(`
      SELECT 
        chat_id,
        username,
        first_name,
        last_name,
        action,
        MAX(created_at) AS last_seen
      FROM telegram_interactions
      GROUP BY chat_id
      ORDER BY last_seen DESC
      LIMIT ?
    `).all(cleanLimit);

    return rows.map((r) => ({
      chat_id: r.chat_id,
      username: r.username || "",
      first_name: r.first_name || "",
      last_name: r.last_name || "",
      displayName:
        `${r.first_name || ""} ${r.last_name || ""}`.trim() ||
        r.username ||
        `Користувач ${r.chat_id}`,
      last_seen: r.last_seen,
    }));
  } catch (err) {
    console.error("[Telegram Interaction Fetch Error]:", err.message);
    return [];
  }
}

/**
 * Handle incoming /start command
 */
export async function handleStartCommand(message, token) {
  const chat = message.chat || {};
  const from = message.from || {};
  const chatId = String(chat.id || from.id || "");
  const text = (message.text || "").trim();

  if (!chatId) return { ok: false, error: "Missing chat ID" };

  // 1. Record interaction in database for admin panel visibility
  recordTelegramInteraction({
    chat_id: chatId,
    username: from.username,
    first_name: from.first_name,
    last_name: from.last_name,
    action: "start",
    payload: { text, date: message.date },
  });

  // 2. Check if user is already an authorized recipient, or auto-register 287686358
  let recipient = getTelegramRecipientByChatId(chatId);
  if (!recipient && (chatId === "287686358" || String(chatId).trim() === "287686358")) {
    try {
      const now = Date.now();
      db.prepare(`
        INSERT INTO telegram_recipients (id, name, username, chat_id, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        "tr_owner_287686358",
        from.first_name ? `${from.first_name} ${from.last_name || ""}`.trim() : "Адміністратор PASIKA",
        from.username ? `@${from.username}` : "@pasika_honey",
        "287686358",
        "owner",
        now,
        now
      );
      recipient = getTelegramRecipientByChatId(chatId);
    } catch {}
  }

  // 3. Prepare response text matching the exact specification:
  // 🐝 PASIKA — Замовлення
  // Бот підключений успішно ✅
  // Ви будете отримувати сповіщення про нові замовлення.
  const replyText = [
    `🐝 <b>PASIKA — Замовлення</b>`,
    ``,
    `Бот підключений успішно ✅`,
    ``,
    `Ви будете отримувати сповіщення про нові замовлення.`,
  ].join("\n");

  // 4. Send reply message if token is configured
  if (token) {
    try {
      await sendMessage(token, {
        chat_id: chatId,
        text: replyText,
      });
    } catch (err) {
      console.warn("[Telegram Start Reply Error]:", err.message);
    }
  }

  return { ok: true, type: "start", chat_id: chatId, isRegistered: Boolean(recipient?.is_active) };
}
