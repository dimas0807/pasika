/**
 * Telegram Message Formatter Module
 * Formats official PASIKA service order cards, notifications, and inline keyboards
 */

export const PASIKA_STATUS_LABELS = {
  NEW: "Нове",
  PROCESSING: "В обробці",
  PACKED: "Запаковано",
  SHIPPED: "Відправлено",
  COMPLETED: "Виконано",
  CANCELLED: "Скасовано",
};

/**
 * Format order card matching the official PASIKA service specification:
 * 
 * 🐝 НОВЕ ЗАМОВЛЕННЯ PASIKA
 * № замовлення: #XXXX
 * 👤 Клієнт:
 * Ім'я Прізвище
 * 📞 Телефон:
 * +380...
 * 📧 Email:
 * ...
 * 🍯 Товари:
 * - Мед натуральний — 1 кг × 2 — 760 грн
 * 💰 Разом:
 * 950 грн
 * 🚚 Доставка:
 * Нова Пошта
 * 📍 Населений пункт:
 * ...
 * 🏤 Відділення:
 * №...
 * 💳 Оплата:
 * Оплата при отриманні
 * 💬 Коментар:
 * ...
 */
export function formatOrderMessage(order, options = {}) {
  const isUpdated = Boolean(options.isUpdated);
  const statusNote = options.statusNote || "";
  const handlerName = options.handlerName || "";

  // Order number
  const orderNumber = order.number ? `#${order.number}` : `#${order.id || ""}`;

  // Customer info
  const firstName = order.customer_first_name || order.customer?.firstName || "";
  const lastName = order.customer_last_name || order.customer?.lastName || "";
  const customerName = `${firstName} ${lastName}`.trim() || "Клієнт";
  const customerPhone = order.customer_phone || order.customer?.phone || "—";
  const customerEmail = order.customer_email || order.customer?.email || "";

  // Items
  const items = order.items || [];
  const itemsLines =
    items.length > 0
      ? items.map((i) => {
          const weightPart = i.weight ? ` — ${i.weight}` : "";
          const qty = i.qty || 1;
          const cost = (i.price || 0) * qty;
          return `- ${i.name}${weightPart} × ${qty} — ${cost} грн`;
        })
      : ["- Товари уточнюються"];

  // Total
  const totalSum = order.total !== undefined ? `${order.total} грн` : "0 грн";

  // Delivery
  const provider = order.delivery_provider || order.delivery?.provider || "Нова Пошта";
  const city = order.delivery_city_name || order.delivery?.city || "Місто не вказано";
  const branch = order.delivery_branch_name || order.delivery?.branch || "Відділення не вказано";

  // Payment
  const isCard = (order.payment_method || order.payment?.method) === "card";
  const paymentMethodLabel = isCard
    ? "Оплата карткою (передоплата)"
    : "Оплата при отриманні";

  let receiptStatus = "";
  if (isCard) {
    const hasReceipt = Boolean(order.receipt_url || order.receipt?.fileUrl || order.receipt?.dataUrl);
    receiptStatus = hasReceipt ? "\n🧾 <b>Чек:</b> Додано клієнтом ✅" : "\n🧾 <b>Чек:</b> Очікується чек ⚠️";
  }

  // Comment
  const comment = (order.comment || "").trim();

  // Status block for updated cards
  let headerTitle = "🐝 <b>НОВЕ ЗАМОВЛЕННЯ PASIKA</b>";
  let statusBlock = "";

  if (isUpdated || (order.status && order.status !== "NEW")) {
    const statusLabel = PASIKA_STATUS_LABELS[order.status] || order.status;
    let statusIcon = "📋";
    if (order.status === "PROCESSING") statusIcon = "✅";
    if (order.status === "CANCELLED") statusIcon = "❌";
    if (order.status === "PACKED") statusIcon = "📦";
    if (order.status === "SHIPPED") statusIcon = "🚚";
    if (order.status === "COMPLETED") statusIcon = "🏁";

    headerTitle = `🐝 <b>ЗАМОВЛЕННЯ PASIKA</b>`;
    statusBlock = `\n📌 <b>Статус:</b> ${statusIcon} ${statusLabel}`;
    if (handlerName) {
      statusBlock += `\n👤 <b>Обробив:</b> ${handlerName}`;
    }
    if (statusNote) {
      statusBlock += `\n💬 <i>${statusNote}</i>`;
    }
    statusBlock += "\n";
  }

  const sections = [
    headerTitle,
    ``,
    `№ замовлення: <b>${orderNumber}</b>`,
    statusBlock || null,
    `👤 <b>Клієнт:</b>\n${customerName}`,
    ``,
    `📞 <b>Телефон:</b>\n${customerPhone}`,
    customerEmail ? `\n📧 <b>Email:</b>\n${customerEmail}` : null,
    ``,
    `🍯 <b>Товари:</b>\n${itemsLines.join("\n")}`,
    ``,
    `💰 <b>Разом:</b>\n<b>${totalSum}</b>`,
    ``,
    `🚚 <b>Доставка:</b>\n${provider}`,
    ``,
    `📍 <b>Населений пункт:</b>\n${city}`,
    ``,
    `🏤 <b>Відділення:</b>\n${branch}`,
    ``,
    `💳 <b>Оплата:</b>\n${paymentMethodLabel}${receiptStatus}`,
    comment ? `\n💬 <b>Коментар:</b>\n${comment}` : null,
  ];

  return sections.filter((s) => s !== null && s !== undefined).join("\n");
}

/**
 * Format status change notification sent to recipients
 */
export function formatStatusChangeNotification(order, prevStatus, newStatus, changerName = null) {
  const prevLabel = PASIKA_STATUS_LABELS[prevStatus] || prevStatus;
  const newLabel = PASIKA_STATUS_LABELS[newStatus] || newStatus;
  const orderNumber = order.number ? `#${order.number}` : `#${order.id || ""}`;
  const firstName = order.customer_first_name || order.customer?.firstName || "";
  const lastName = order.customer_last_name || order.customer?.lastName || "";
  const customerName = `${firstName} ${lastName}`.trim();

  let icon = "🔄";
  if (newStatus === "PROCESSING") icon = "✅";
  if (newStatus === "CANCELLED") icon = "❌";
  if (newStatus === "PACKED") icon = "📦";
  if (newStatus === "SHIPPED") icon = "🚚";
  if (newStatus === "COMPLETED") icon = "🏁";

  const lines = [
    `${icon} <b>Зміна статусу замовлення ${orderNumber}</b>`,
    ``,
    `Попередній: <s>${prevLabel}</s>`,
    `Новий статус: <b>${newLabel}</b>`,
    customerName ? `Клієнт: ${customerName}` : null,
    changerName ? `Змінив: ${changerName}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

/**
 * Build inline keyboard with action buttons
 */
export function buildOrderInlineKeyboard(order, currentStatus = null) {
  const baseUrl = (process.env.APP_URL || process.env.PUBLIC_URL || "http://localhost:3001").replace(/\/$/, "");
  const orderUrl = `${baseUrl}/admin/orders/${order.id}`;

  const status = currentStatus || order.status || "NEW";

  const rows = [
    [
      {
        text: "📋 Відкрити замовлення",
        url: orderUrl,
      },
    ],
  ];

  if (status === "NEW") {
    rows.push([
      {
        text: "✅ Прийняти",
        callback_data: `order_accept_${order.id}`,
      },
      {
        text: "❌ Відхилити",
        callback_data: `order_reject_${order.id}`,
      },
    ]);
  } else if (status === "PROCESSING") {
    rows.push([
      {
        text: "❌ Відхилити",
        callback_data: `order_reject_${order.id}`,
      },
    ]);
  }

  return {
    inline_keyboard: rows,
  };
}
