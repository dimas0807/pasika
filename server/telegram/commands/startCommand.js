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

  // 2. Check if user is already an authorized recipient
  const recipient = getTelegramRecipientByChatId(chatId);

  // 3. Prepare response text
  let replyText = "";

  if (recipient && recipient.is_active) {
    replyText = [
      `🐝 <b>Вітаємо у службовому боті PASIKA!</b>`,
      ``,
      `👤 Ви підключені як отримувач: <b>${recipient.name}</b>`,
      `Роль: <b>${recipient.role}</b>`,
      `Chat ID: <code>${chatId}</code>`,
      ``,
      `✅ Система сповіщень активна. Ви отримуватимете нові замовлення з сайту PASIKA.`,
    ].join("\n");
  } else if (recipient && !recipient.is_active) {
    replyText = [
      `🐝 <b>Службовий бот PASIKA</b>`,
      ``,
      `👤 Ви зареєстровані як <b>${recipient.name}</b>, але профіль наразі <b>деактивовано</b> в адмін-панелі.`,
      `Chat ID: <code>${chatId}</code>`,
      ``,
      `Зверніться до власника або адміністратора для повторної активації.`,
    ].join("\n");
  } else {
    const fullName = `${from.first_name || ""} ${from.last_name || ""}`.trim();
    replyText = [
      `🐝 <b>Вітаємо у службовому боті PASIKA!</b>`,
      ``,
      `Ваш Chat ID: <code>${chatId}</code>`,
      fullName ? `Ім'я: ${fullName}` : null,
      from.username ? `Username: @${from.username}` : null,
      ``,
      `📌 <b>Щоб отримувати службові сповіщення про замовлення:</b>`,
      `Передайте цей Chat ID власнику або додайте його в панелі керування PASIKA:`,
      `<i>Налаштування → Telegram → Додати отримувача</i>`,
    ].filter(Boolean).join("\n");
  }

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
