/**
 * Telegram Webhook Handler Module
 * Central dispatcher for incoming Telegram Bot API updates (Messages, Callbacks)
 */

import { getTelegramCredentials } from "../config/botConfig.js";
import { handleStartCommand } from "../commands/startCommand.js";
import { handleCallbackQuery } from "../callbacks/orderCallbacks.js";

/**
 * Main webhook update processor
 */
export async function handleTelegramWebhook(update) {
  if (!update || typeof update !== "object") {
    return { ok: false, error: "Invalid update payload" };
  }

  const { token, enabled } = getTelegramCredentials();

  // If Telegram integration is globally disabled, ignore incoming requests
  if (!enabled) {
    return { ok: true, ignored: true, reason: "telegram_disabled" };
  }

  // 1. Process Messages
  if (update.message) {
    const text = (update.message.text || "").trim();
    if (text.startsWith("/start")) {
      return await handleStartCommand(update.message, token);
    }
    // Other message commands could be added here in the future
    return { ok: true, ignored: true, reason: "unsupported_message_command" };
  }

  // 2. Process Callback Queries (Inline Buttons)
  if (update.callback_query) {
    return await handleCallbackQuery(update.callback_query, token);
  }

  return { ok: true, ignored: true };
}
