/**
 * Telegram Bot API Client
 * Secure HTTP client for Telegram Bot API communication
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";

/**
 * Mask token in strings to prevent secret leakage in logs/errors
 */
export function maskToken(token) {
  if (!token || typeof token !== "string") return "";
  if (token.length <= 8) return "••••••••";
  return token.slice(0, 4) + "••••••••" + token.slice(-4);
}

/**
 * Low-level API caller
 */
export async function callTelegramApi(token, method, payload = null, options = {}) {
  const cleanToken = (token || "").trim();
  if (!cleanToken) {
    return { ok: false, error: "Telegram Bot Token не задано" };
  }

  const url = `${TELEGRAM_API_BASE}/bot${cleanToken}/${method}`;
  const requestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    signal: options.signal,
  };

  if (payload !== null && payload !== undefined) {
    requestInit.body = JSON.stringify(payload);
  }

  try {
    const res = await fetch(url, requestInit);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      const desc = data.description || `HTTP ${res.status} ${res.statusText}`;
      return {
        ok: false,
        error: desc,
        errorCode: data.error_code || res.status,
        description: desc,
      };
    }

    return {
      ok: true,
      result: data.result,
    };
  } catch (err) {
    // Sanitize any URL or token that might have leaked into error message
    let safeMessage = err.message || "Помилка мережевого з'єднання з Telegram API";
    if (cleanToken && safeMessage.includes(cleanToken)) {
      safeMessage = safeMessage.replaceAll(cleanToken, "[PROTECTED_TOKEN]");
    }
    return {
      ok: false,
      error: safeMessage,
      networkError: true,
    };
  }
}

/**
 * Verify bot token and get bot profile
 */
export async function getMe(token) {
  return await callTelegramApi(token, "getMe", null);
}

/**
 * Send a text message to a chat
 */
export async function sendMessage(token, { chat_id, text, parse_mode = "HTML", reply_markup = null }) {
  const payload = {
    chat_id: String(chat_id),
    text: String(text),
    parse_mode,
  };
  if (reply_markup) {
    payload.reply_markup = reply_markup;
  }
  return await callTelegramApi(token, "sendMessage", payload);
}

/**
 * Edit an existing message text
 */
export async function editMessageText(token, { chat_id, message_id, text, parse_mode = "HTML", reply_markup = null }) {
  const payload = {
    chat_id: String(chat_id),
    message_id: Number(message_id),
    text: String(text),
    parse_mode,
  };
  if (reply_markup) {
    payload.reply_markup = reply_markup;
  }
  return await callTelegramApi(token, "editMessageText", payload);
}

/**
 * Answer an incoming callback query (popup alert or toast)
 */
export async function answerCallbackQuery(token, { callback_query_id, text = null, show_alert = false, cache_time = 0 }) {
  const payload = {
    callback_query_id: String(callback_query_id),
    show_alert: Boolean(show_alert),
    cache_time,
  };
  if (text) {
    payload.text = String(text);
  }
  return await callTelegramApi(token, "answerCallbackQuery", payload);
}

/**
 * Set webhook URL
 */
export async function setWebhook(token, { url, secret_token = null, allowed_updates = ["message", "callback_query"] }) {
  const payload = {
    url: String(url),
    allowed_updates,
  };
  if (secret_token) {
    payload.secret_token = String(secret_token);
  }
  return await callTelegramApi(token, "setWebhook", payload);
}

/**
 * Delete webhook (switch back to long-polling if needed)
 */
export async function deleteWebhook(token, drop_pending_updates = false) {
  return await callTelegramApi(token, "deleteWebhook", { drop_pending_updates });
}
