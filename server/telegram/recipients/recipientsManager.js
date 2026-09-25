/**
 * Telegram Recipients Manager
 * Manages authorized recipient profiles (owner, admin, manager) in SQLite
 */

import crypto from "node:crypto";
import { db } from "../../db.js";
import { sendMessage } from "../client/botApi.js";
import { getTelegramCredentials } from "../config/botConfig.js";
import { logTelegramEvent } from "../logging/telegramLogger.js";

/**
 * List all registered recipients ordered by role priority then date
 */
export function getTelegramRecipients() {
  const rows = db.prepare(`
    SELECT * FROM telegram_recipients
    ORDER BY 
      CASE role 
        WHEN 'owner' THEN 1 
        WHEN 'admin' THEN 2 
        ELSE 3 
      END,
      created_at ASC
  `).all();

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    username: r.username || "",
    chat_id: r.chat_id,
    role: r.role || "manager",
    is_active: Boolean(r.is_active),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 * Find recipient by ID
 */
export function getTelegramRecipientById(id) {
  const row = db.prepare("SELECT * FROM telegram_recipients WHERE id = ?").get(id);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username || "",
    chat_id: row.chat_id,
    role: row.role || "manager",
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Find recipient by chat_id (used to authenticate Telegram callbacks & commands)
 */
export function getTelegramRecipientByChatId(chatId) {
  if (!chatId) return null;
  const cleanId = String(chatId).trim();
  const row = db.prepare("SELECT * FROM telegram_recipients WHERE chat_id = ?").get(cleanId);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username || "",
    chat_id: row.chat_id,
    role: row.role || "manager",
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Register a new recipient
 */
export function createTelegramRecipient({ name, username, chat_id, role = "manager", is_active = true }) {
  const cleanName = (name || "").trim();
  const cleanChatId = String(chat_id || "").trim();

  if (!cleanName) {
    throw new Error("Вкажіть ім'я отримувача");
  }
  if (!cleanChatId) {
    throw new Error("Вкажіть Telegram Chat ID отримувача");
  }

  const validRoles = ["owner", "admin", "manager"];
  const cleanRole = validRoles.includes(role) ? role : "manager";

  let cleanUsername = (username || "").trim();
  if (cleanUsername && !cleanUsername.startsWith("@")) {
    cleanUsername = "@" + cleanUsername;
  }

  const id = "tr_" + Date.now().toString(36) + "_" + crypto.randomBytes(3).toString("hex");
  const now = Date.now();

  db.prepare(`
    INSERT INTO telegram_recipients (id, name, username, chat_id, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    cleanName,
    cleanUsername || null,
    cleanChatId,
    cleanRole,
    is_active ? 1 : 0,
    now,
    now
  );

  return getTelegramRecipientById(id);
}

/**
 * Update an existing recipient
 */
export function updateTelegramRecipient(id, { name, username, chat_id, role, is_active }) {
  const existing = getTelegramRecipientById(id);
  if (!existing) {
    throw new Error("Отримувача не знайдено");
  }

  const cleanName = name !== undefined ? String(name).trim() : existing.name;
  const cleanChatId = chat_id !== undefined ? String(chat_id).trim() : existing.chat_id;

  if (!cleanName) throw new Error("Ім'я не може бути порожнім");
  if (!cleanChatId) throw new Error("Chat ID не може бути порожнім");

  const validRoles = ["owner", "admin", "manager"];
  const cleanRole = role !== undefined && validRoles.includes(role) ? role : existing.role;

  let cleanUsername = username !== undefined ? String(username).trim() : existing.username;
  if (cleanUsername && !cleanUsername.startsWith("@")) {
    cleanUsername = "@" + cleanUsername;
  }

  const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : (existing.is_active ? 1 : 0);
  const now = Date.now();

  db.prepare(`
    UPDATE telegram_recipients
    SET name = ?, username = ?, chat_id = ?, role = ?, is_active = ?, updated_at = ?
    WHERE id = ?
  `).run(cleanName, cleanUsername || null, cleanChatId, cleanRole, activeVal, now, id);

  return getTelegramRecipientById(id);
}

/**
 * Delete a recipient
 */
export function deleteTelegramRecipient(id) {
  const info = db.prepare("DELETE FROM telegram_recipients WHERE id = ?").run(id);
  if (info.changes === 0) {
    throw new Error("Отримувача не знайдено");
  }
  return { ok: true, id };
}

/**
 * Toggle recipient active / inactive status
 */
export function toggleTelegramRecipient(id) {
  const existing = getTelegramRecipientById(id);
  if (!existing) {
    throw new Error("Отримувача не знайдено");
  }

  const nextActive = existing.is_active ? 0 : 1;
  const now = Date.now();

  db.prepare("UPDATE telegram_recipients SET is_active = ?, updated_at = ? WHERE id = ?").run(
    nextActive,
    now,
    id
  );

  return getTelegramRecipientById(id);
}

/**
 * Send a test notification to a specific recipient
 */
export async function testRecipientNotification(recipientId, customText = null) {
  const recipient = getTelegramRecipientById(recipientId);
  if (!recipient) {
    return { ok: false, error: "Отримувача не знайдено" };
  }

  const { token } = getTelegramCredentials();
  const text =
    customText ||
    `🐝 <b>Тестове сповіщення PASIKA</b>\n\nОтримувач: <b>${recipient.name}</b> (${recipient.role})\nСтатус: Активний ✅\nСистема сповіщень налаштована коректно!`;

  if (!token) {
    // Simulated demo mode for environments without a configured bot token
    logTelegramEvent({
      recipientId: recipient.id,
      chatId: recipient.chat_id,
      text,
      status: "SIMULATED",
      responseData: { note: "Bot token not configured. Simulated test mode." },
    });

    return {
      ok: true,
      simulated: true,
      message: `[Демо-режим]: тестове повідомлення для ${recipient.name} змодельовано успішно (токен бота ще не задано).`,
    };
  }

  try {
    const apiRes = await sendMessage(token, {
      chat_id: recipient.chat_id,
      text,
    });

    if (apiRes.ok) {
      logTelegramEvent({
        recipientId: recipient.id,
        chatId: recipient.chat_id,
        text,
        status: "SENT",
        responseData: apiRes.result,
      });

      return {
        ok: true,
        simulated: false,
        message: `Тестове сповіщення успішно надіслано до ${recipient.name} (${recipient.chat_id})!`,
      };
    } else {
      const errDesc = apiRes.error || "Помилка Telegram API";
      logTelegramEvent({
        recipientId: recipient.id,
        chatId: recipient.chat_id,
        text,
        status: "FAILED",
        responseData: { error: errDesc },
      });

      return { ok: false, error: errDesc };
    }
  } catch (err) {
    logTelegramEvent({
      recipientId: recipient.id,
      chatId: recipient.chat_id,
      text,
      status: "FAILED",
      responseData: { error: err.message },
    });

    return { ok: false, error: err.message };
  }
}
