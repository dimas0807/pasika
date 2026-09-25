import crypto from "node:crypto";
import { db } from "./db.js";

export function formatOrderMessage(order) {
  const items = (order.items || [])
    .map((i) => `— ${i.name}${i.weight ? ` (${i.weight})` : ""} x${i.qty} — ${i.price * i.qty} грн`)
    .join("\n");

  const isCard = (order.payment_method || order.payment?.method) === "card";
  const paymentLabel = isCard ? "Оплачено наперед" : "Оплата при отриманні";
  const receiptStatus = isCard
    ? (order.receipt_url || order.receipt?.fileUrl || order.receipt?.dataUrl ? "Додано ✅" : "Не додано ⚠️")
    : "Не потрібен";

  return [
    `🔔 НОВЕ ЗАМОВЛЕННЯ #${order.number}`,
    ``,
    `👤 ${order.customer_first_name || order.customer?.firstName} ${order.customer_last_name || order.customer?.lastName}`,
    `📞 ${order.customer_phone || order.customer?.phone}`,
    `📧 ${(order.customer_email || order.customer?.email) || "—"}`,
    ``,
    `📦 Товари:`,
    items || "—",
    `💰 Сума: ${order.total} грн`,
    ``,
    `🚚 Доставка: ${order.delivery_provider || order.delivery?.provider}`,
    `📍 Місто: ${order.delivery_city_name || order.delivery?.city}`,
    `🏤 Відділення: ${order.delivery_branch_name || order.delivery?.branch}`,
    ``,
    `💳 Оплата: ${paymentLabel}`,
    `🧾 Чек: ${receiptStatus}`,
    ``,
    `💬 Коментар: ${order.comment || "—"}`,
  ].join("\n");
}

export function getTelegramCredentials() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  let dbSettings = {};
  if (row) {
    try {
      dbSettings = JSON.parse(row.value);
    } catch {}
  }
  const token = dbSettings.telegram?.botToken?.trim() || process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const chatId = dbSettings.telegram?.chatId?.trim() || process.env.TELEGRAM_CHAT_ID?.trim() || "";
  return { token, chatId };
}

export async function testTelegramConnection(customToken, customChatId) {
  const { token: savedToken, chatId: savedChatId } = getTelegramCredentials();
  const token = (customToken && customToken !== "••••••••••••••••" ? customToken : savedToken)?.trim();
  const chatId = (customChatId || savedChatId)?.trim();

  if (!token) {
    return { ok: false, error: "Telegram Bot Token не налаштовано" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || "Невірний токен бота" };
    }

    const botName = data.result?.username ? `@${data.result.username}` : data.result?.first_name || "Bot";

    if (chatId) {
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🐝 Honey Pasika: тестове сповіщення успішно надіслано! З'єднання з Telegram налаштовано.`,
          }),
        });
      } catch (e) {
        console.warn("[Telegram test message warning]:", e.message);
      }
    }

    return {
      ok: true,
      botName,
      message: `З'єднання успішне! Бот: ${botName}${chatId ? " (тестове повідомлення надіслано в чат)" : ""}`,
    };
  } catch (err) {
    return { ok: false, error: err.message || "Помилка зв'язку з сервером Telegram" };
  }
}

export async function sendOrderTelegramNotification(order) {
  const text = formatOrderMessage(order);
  const { token, chatId } = getTelegramCredentials();
  const logId = "tg_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex");

  if (!token || !chatId) {
    // Demo fallback / simulation mode
    db.prepare(`
      INSERT INTO telegram_logs (id, order_id, text, status, response_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      order.id,
      text,
      "SIMULATED",
      JSON.stringify({ note: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured" }),
      Date.now()
    );

    console.log(`[Telegram Simulation] Order #${order.number} logged locally (no ENV or DB keys).`);
    return { ok: true, simulated: true };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      db.prepare(`
        INSERT INTO telegram_logs (id, order_id, text, status, response_data, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(logId, order.id, text, "SENT", JSON.stringify(data), Date.now());

      return { ok: true, simulated: false };
    } else {
      db.prepare(`
        INSERT INTO telegram_logs (id, order_id, text, status, response_data, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(logId, order.id, text, "FAILED", JSON.stringify(data), Date.now());

      console.error(`[Telegram Error] API returned error:`, data);
      return { ok: false, error: data.description || "Failed to send Telegram message" };
    }
  } catch (err) {
    db.prepare(`
      INSERT INTO telegram_logs (id, order_id, text, status, response_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(logId, order.id, text, "FAILED", JSON.stringify({ error: err.message }), Date.now());

    console.error(`[Telegram Network Error]:`, err.message);
    return { ok: false, error: err.message };
  }
}
