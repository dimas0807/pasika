/**
 * Telegram Configuration Module
 * Manages bot credentials, master enable/disable state, and connection testing
 */

import { db } from "../../db.js";
import { getMe, sendMessage } from "../client/botApi.js";

/**
 * Retrieve raw server-side credentials
 * NEVER expose this object directly to frontend clients!
 */
export function getTelegramCredentials() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  let dbSettings = {};
  if (row) {
    try {
      dbSettings = JSON.parse(row.value);
    } catch {}
  }

  const tg = dbSettings.telegram || {};
  const token = (tg.botToken || process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const enabled = tg.enabled !== undefined ? Boolean(tg.enabled) : true;
  const botUsername = tg.botUsername || "";
  const lastStatus = tg.lastStatus || (token ? "configured" : "unconfigured");
  const lastCheckedAt = tg.lastCheckedAt || null;
  const lastError = tg.lastError || null;
  const legacyChatId = (tg.chatId || process.env.TELEGRAM_CHAT_ID || "").trim();

  return {
    token,
    enabled,
    botUsername,
    lastStatus,
    lastCheckedAt,
    lastError,
    legacyChatId,
  };
}

/**
 * Get sanitized configuration for public/admin responses
 * Token is ALWAYS masked with bullets
 */
export function getTelegramConfig() {
  const creds = getTelegramCredentials();
  return {
    enabled: creds.enabled,
    hasToken: Boolean(creds.token),
    botToken: creds.token ? "••••••••••••••••" : "",
    botUsername: creds.botUsername,
    status: creds.lastStatus,
    lastCheckedAt: creds.lastCheckedAt,
    lastError: creds.lastError,
  };
}

/**
 * Update Telegram configuration from admin panel
 */
export function updateTelegramConfig({ enabled, botToken }) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  let settings = {};
  if (row) {
    try {
      settings = JSON.parse(row.value);
    } catch {}
  }

  if (!settings.telegram) {
    settings.telegram = {};
  }

  if (enabled !== undefined) {
    settings.telegram.enabled = Boolean(enabled);
  }

  if (botToken !== undefined) {
    const raw = String(botToken).trim();
    if (raw && raw !== "••••••••••••••••") {
      settings.telegram.botToken = raw;
      // Reset status on new token save
      settings.telegram.lastStatus = "unverified";
      settings.telegram.lastError = null;
    } else if (raw === "") {
      settings.telegram.botToken = "";
      settings.telegram.botUsername = "";
      settings.telegram.lastStatus = "unconfigured";
      settings.telegram.lastError = null;
    }
  }

  db.prepare("UPDATE settings SET value = ? WHERE key = 'app_settings'").run(
    JSON.stringify(settings)
  );

  return getTelegramConfig();
}

/**
 * Internal helper to update bot status in SQLite
 */
export function updateTelegramStatus({ status, botUsername, error }) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  if (!row) return;

  try {
    const settings = JSON.parse(row.value);
    if (!settings.telegram) settings.telegram = {};
    settings.telegram.lastStatus = status;
    settings.telegram.lastCheckedAt = Date.now();
    if (botUsername !== undefined) settings.telegram.botUsername = botUsername;
    if (error !== undefined) settings.telegram.lastError = error;
    db.prepare("UPDATE settings SET value = ? WHERE key = 'app_settings'").run(
      JSON.stringify(settings)
    );
  } catch (err) {
    console.warn("[Telegram Status Update Error]:", err.message);
  }
}

/**
 * Test Telegram bot connection and optionally send a test message
 */
export async function testTelegramConnection(customToken, customChatId) {
  const creds = getTelegramCredentials();
  const token = (customToken && customToken !== "••••••••••••••••" ? customToken : creds.token)?.trim();

  if (!token) {
    updateTelegramStatus({ status: "unconfigured", error: "Token not set" });
    return { ok: false, error: "Telegram Bot Token не налаштовано" };
  }

  try {
    const apiRes = await getMe(token);

    if (!apiRes.ok || !apiRes.result) {
      const errMsg = apiRes.error || "Невірний токен бота";
      updateTelegramStatus({ status: "error", error: errMsg });
      return { ok: false, error: errMsg };
    }

    const botUsername = apiRes.result?.username ? `@${apiRes.result.username}` : "";
    const botName = apiRes.result?.first_name || "Honey Bot";
    updateTelegramStatus({ status: "connected", botUsername, error: null });

    // If customChatId is provided, also send a test message
    const chatId = (customChatId || "").trim();
    if (chatId) {
      try {
        await sendMessage(token, {
          chat_id: chatId,
          text: `🐝 <b>Honey Pasika</b>: тестове сповіщення успішно надіслано!\nЗ'єднання з ботом ${botUsername || botName} працює ідеально.`,
        });
      } catch (sendErr) {
        console.warn("[Telegram test send message warning]:", sendErr.message);
      }
    }

    return {
      ok: true,
      botName,
      botUsername,
      message: `З'єднання успішне! Бот: ${botUsername || botName}${chatId ? " (тестове повідомлення надіслано в чат)" : ""}`,
    };
  } catch (err) {
    updateTelegramStatus({ status: "error", error: err.message });
    return { ok: false, error: err.message || "Помилка зв'язку з сервером Telegram" };
  }
}
