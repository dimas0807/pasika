// Telegram notification service — now handled entirely on the server!
// Sensitive tokens (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) reside ONLY in server ENV.
// The server automatically triggers notifications when orders are created (/api/orders).

export async function sendOrderToTelegram(_order) {
  // Order notifications are executed server-side.
  return { ok: true, serverHandled: true };
}
