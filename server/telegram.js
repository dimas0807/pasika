import crypto from "node:crypto";
import { db } from "./db.js";

export function formatOrderMessage(order) {
  const items = (order.items || [])
    .map((i) => `— ${i.name}${i.weight ? ` (${i.weight})` : ""} x${i.qty} — ${i.price * i.qty} грн`)
    .join("\n");

  const receiptStatus = order.receipt_url || order.receipt?.fileUrl || order.receipt?.dataUrl
    ? "Додано ✅"
    : "Не додано";

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
    `💳 Оплата: ${(order.payment_method || order.payment?.method) === "card" ? "На картку" : "При отриманні (накладений)"}`,
    `🧾 Чек: ${receiptStatus}`,
    ``,
    `💬 Коментар: ${order.comment || "—"}`,
  ].join("\n");
}

export async function sendOrderTelegramNotification(order) {
  const text = formatOrderMessage(order);
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
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
      JSON.stringify({ note: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in ENV" }),
      Date.now()
    );

    console.log(`[Telegram Simulation] Order #${order.number} logged locally (no ENV keys).`);
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
