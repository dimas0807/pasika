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

  // Date
  const rawDate = order.createdAt || order.created_at || Date.now();
  const dateObj = new Date(rawDate);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString("uk-UA", {
        timeZone: "Europe/Kyiv",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "щойно";

  // Delivery line
  const deliveryParts = [provider, city !== "Місто не вказано" ? city : "", branch !== "Відділення не вказано" ? branch : ""].filter(Boolean);
  const deliveryText = deliveryParts.length > 0 ? deliveryParts.join(", ") : provider;

  const sections = [
    headerTitle,
    ``,
    `📦 <b>Замовлення:</b> <b>${orderNumber}</b>`,
    statusBlock || null,
    ``,
    `👤 <b>Клієнт:</b> ${customerName}`,
    `📞 <b>Телефон:</b> ${customerPhone}`,
    customerEmail ? `📧 <b>Email:</b> ${customerEmail}` : null,
    ``,
    `🛒 <b>Товари:</b>\n${itemsLines.join("\n")}`,
    ``,
    `💰 <b>Сума:</b> <b>${totalSum}</b>`,
    ``,
    `🚚 <b>Доставка:</b>\n${deliveryText}`,
    ``,
    `💳 <b>Оплата:</b>\n${paymentMethodLabel}${receiptStatus}`,
    ``,
    `📅 <b>Дата:</b> ${formattedDate}`,
    comment ? `\n💬 <b>Коментар:</b> ${comment}` : null,
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

  const trackingNumber = order.tracking_number || order.delivery?.trackingNumber || "";
  const deliveryService = order.delivery_service || order.delivery?.deliveryService || order.delivery_provider || "";

  const lines = [
    `${icon} <b>Зміна статусу замовлення ${orderNumber}</b>`,
    ``,
    `Попередній: <s>${prevLabel}</s>`,
    `Новий статус: <b>${newLabel}</b>`,
    customerName ? `Клієнт: ${customerName}` : null,
    trackingNumber ? `🏷 ТТН: <code>${trackingNumber}</code>` : null,
    deliveryService ? `🚚 Служба: ${deliveryService}` : null,
    changerName ? `Змінив: ${changerName}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

/**
 * Resolve public base URL for Telegram buttons (Telegram Bot API rejects localhost)
 */
export function getAppBaseUrl() {
  const custom = (process.env.APP_URL || process.env.PUBLIC_URL || "").trim();
  if (custom && !custom.includes("localhost") && !custom.includes("127.0.0.1")) {
    return custom.replace(/\/$/, "");
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${domain}`;
  }
  if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes("localhost")) {
    return process.env.FRONTEND_URL.replace(/\/$/, "");
  }
  return "https://pasika-production.up.railway.app";
}

/**
 * Build inline keyboard with action buttons
 */
export function buildOrderInlineKeyboard(order, currentStatus = null) {
  const baseUrl = getAppBaseUrl();
  const orderUrl = `${baseUrl}/admin/orders/${order.id}`;

  const status = currentStatus || order.status || "NEW";
  const trackingNumber = order.tracking_number || order.delivery?.trackingNumber;
  const isUp =
    order.delivery_provider_key === "up" ||
    (order.delivery_service && order.delivery_service.toLowerCase().includes("укр"));
  const trackingUrl = trackingNumber
    ? isUp
      ? `https://track.ukrposhta.ua/tracking_UA.html?barcode=${encodeURIComponent(trackingNumber)}`
      : `https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(trackingNumber)}`
    : null;

  const topRow = [
    {
      text: "📋 Відкрити замовлення",
      url: orderUrl,
    },
  ];

  if (trackingUrl) {
    topRow.push({
      text: "🌐 Відстежити ТТН",
      url: trackingUrl,
    });
  }

  const rows = [topRow];

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
