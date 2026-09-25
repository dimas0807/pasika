/**
 * Telegram Callbacks Module
 * Handles incoming inline button interactions from Telegram
 */

import { answerCallbackQuery, editMessageText } from "../client/botApi.js";
import { executeOrderAction } from "../orders/actions.js";
import { formatOrderMessage, buildOrderInlineKeyboard } from "../messages/formatter.js";

/**
 * Handle incoming callback query
 */
export async function handleCallbackQuery(callbackQuery, token) {
  const cbId = callbackQuery.id;
  const data = callbackQuery.data || "";
  const fromUser = callbackQuery.from || {};
  const senderChatId = String(fromUser.id || "");
  const message = callbackQuery.message;

  // 1. Check callback data pattern
  let action = null;
  let orderId = null;

  if (data.startsWith("order_accept_")) {
    action = "accept";
    orderId = data.replace("order_accept_", "").trim();
  } else if (data.startsWith("order_reject_")) {
    action = "reject";
    orderId = data.replace("order_reject_", "").trim();
  } else {
    // Unknown callback data
    if (token && cbId) {
      await answerCallbackQuery(token, {
        callback_query_id: cbId,
        text: "⚠️ Невідома дія",
        show_alert: false,
      });
    }
    return { ok: false, error: "Unknown callback data" };
  }

  // 2. Execute order action through security & DB validation
  const result = executeOrderAction({
    orderId,
    action,
    senderChatId,
    senderUser: fromUser,
  });

  // 3. Answer Telegram callback query (shows toast or alert popup on device)
  if (token && cbId) {
    try {
      await answerCallbackQuery(token, {
        callback_query_id: cbId,
        text: result.message,
        show_alert: !result.success || result.error === "UNAUTHORIZED",
      });
    } catch (err) {
      console.warn("[Telegram Answer Callback Query Error]:", err.message);
    }
  }

  // 4. If action succeeded, update the message card in Telegram
  if (result.success && result.order && message && token) {
    try {
      const handlerName = result.recipient
        ? `${result.recipient.name}${fromUser.username ? ` (@${fromUser.username})` : ""}`
        : `${fromUser.first_name || ""} ${fromUser.last_name || ""}`.trim();

      const updatedText = formatOrderMessage(result.order, {
        isUpdated: true,
        handlerName,
      });

      const updatedKeyboard = buildOrderInlineKeyboard(result.order, result.newStatus);

      await editMessageText(token, {
        chat_id: message.chat.id,
        message_id: message.message_id,
        text: updatedText,
        reply_markup: updatedKeyboard,
      });
    } catch (err) {
      console.warn("[Telegram Edit Message Card Warning]:", err.message);
    }
  }

  return {
    ok: result.success,
    type: `callback_${action}`,
    orderId,
    status: result.newStatus || null,
    message: result.message,
    recipient: result.recipient?.name || null,
  };
}
