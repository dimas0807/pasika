/**
 * Telegram Order Notifications Module
 * Dispatches order notifications and status change alerts to active recipients
 * Guaranteed fault tolerance: network/API failures NEVER break or block checkout
 */

import { sendMessage } from "../client/botApi.js";
import { getTelegramCredentials } from "../config/botConfig.js";
import { getTelegramRecipients } from "../recipients/recipientsManager.js";
import { formatOrderMessage, buildOrderInlineKeyboard, formatStatusChangeNotification } from "../messages/formatter.js";
import { logTelegramEvent } from "../logging/telegramLogger.js";

/**
 * Dispatch new order notification to all active recipients
 */
export async function sendOrderTelegramNotification(order) {
  try {
    const { token, enabled, legacyChatId } = getTelegramCredentials();
    const text = formatOrderMessage(order);
    const replyMarkup = buildOrderInlineKeyboard(order);

    // 1. Check if Telegram integration is enabled
    if (!enabled) {
      logTelegramEvent({
        orderId: order.id,
        text,
        status: "DISABLED",
        responseData: { note: "Telegram notifications are currently disabled in settings" },
      });
      return { ok: true, disabled: true };
    }

    // 2. Fetch active recipients
    let recipients = getTelegramRecipients().filter((r) => r.is_active);

    // Fallback to legacy single chat ID if recipients table has no active records
    if (recipients.length === 0 && legacyChatId) {
      recipients = [
        {
          id: "tr_legacy",
          name: "Головний чат",
          chat_id: legacyChatId,
          role: "owner",
          is_active: true,
        },
      ];
    }

    // 3. If no active recipients or no token, log as SIMULATED (safe development / zero secrets mode)
    if (!token || recipients.length === 0) {
      logTelegramEvent({
        orderId: order.id,
        text,
        status: "SIMULATED",
        responseData: {
          note: !token
            ? "Telegram Bot Token not configured in DB or ENV. Notification simulated."
            : "No active recipients configured in Telegram settings.",
        },
      });

      return {
        ok: true,
        simulated: true,
        recipientCount: recipients.length,
      };
    }

    // 4. Send to all active recipients concurrently
    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        try {
          const apiRes = await sendMessage(token, {
            chat_id: recipient.chat_id,
            text,
            reply_markup: replyMarkup,
          });

          if (apiRes.ok) {
            logTelegramEvent({
              orderId: order.id,
              recipientId: recipient.id,
              chatId: recipient.chat_id,
              text,
              status: "SENT",
              responseData: apiRes.result,
            });
            return { ok: true, recipientId: recipient.id };
          } else {
            logTelegramEvent({
              orderId: order.id,
              recipientId: recipient.id,
              chatId: recipient.chat_id,
              text,
              status: "FAILED",
              responseData: { error: apiRes.error },
            });
            return { ok: false, recipientId: recipient.id, error: apiRes.error };
          }
        } catch (err) {
          logTelegramEvent({
            orderId: order.id,
            recipientId: recipient.id,
            chatId: recipient.chat_id,
            text,
            status: "FAILED",
            responseData: { error: err.message },
          });
          return { ok: false, recipientId: recipient.id, error: err.message };
        }
      })
    );

    const sentCount = results.filter((r) => r.status === "fulfilled" && r.value?.ok).length;
    const failedCount = results.length - sentCount;

    return {
      ok: sentCount > 0 || recipients.length === 0,
      total: recipients.length,
      sentCount,
      failedCount,
    };
  } catch (err) {
    // Top-level catch to ensure checkout is NEVER broken by Telegram dispatch errors
    console.error("[Telegram Order Notification Dispatch Error]:", err.message);
    logTelegramEvent({
      orderId: order?.id || null,
      text: "Unhandled error during order notification dispatch",
      status: "FAILED",
      responseData: { error: err.message },
    });
    return {
      ok: false,
      error: err.message,
      sentCount: 0,
    };
  }
}

/**
 * Dispatch status change alert to active recipients when order status is changed in admin panel
 */
export async function notifyOrderStatusChange(order, prevStatus, newStatus, changerName = null) {
  try {
    const { token, enabled } = getTelegramCredentials();
    if (!enabled || !token) return { ok: true, skipped: true };

    const recipients = getTelegramRecipients().filter((r) => r.is_active);
    if (recipients.length === 0) return { ok: true, noRecipients: true };

    const text = formatStatusChangeNotification(order, prevStatus, newStatus, changerName);
    const baseUrl = (process.env.APP_URL || process.env.PUBLIC_URL || "http://localhost:3001").replace(/\/$/, "");
    const orderUrl = `${baseUrl}/admin/orders/${order.id}`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "📋 Відкрити замовлення",
            url: orderUrl,
          },
        ],
      ],
    };

    await Promise.allSettled(
      recipients.map((recipient) =>
        sendMessage(token, {
          chat_id: recipient.chat_id,
          text,
          reply_markup: replyMarkup,
        }).then((res) => {
          if (res.ok) {
            logTelegramEvent({
              orderId: order.id,
              recipientId: recipient.id,
              chatId: recipient.chat_id,
              text,
              status: "SENT",
              responseData: res.result,
            });
          }
        })
      )
    );

    return { ok: true };
  } catch (err) {
    console.warn("[Telegram Status Change Notification Warning]:", err.message);
    return { ok: false, error: err.message };
  }
}
