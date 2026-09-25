/**
 * Telegram Order Actions Module
 * Executes business operations on orders initiated from Telegram (Accept / Reject)
 * Ensures security checks, authorized recipient verification, and SQLite database atomicity
 */

import { db } from "../../db.js";
import { getTelegramRecipientByChatId } from "../recipients/recipientsManager.js";
import { logTelegramEvent } from "../logging/telegramLogger.js";

/**
 * Execute order action initiated from Telegram
 */
export function executeOrderAction({
  orderId,
  action, // 'accept' or 'reject'
  senderChatId,
  senderUser = null,
}) {
  const cleanOrderId = String(orderId || "").trim();
  const cleanChatId = String(senderChatId || "").trim();

  // 1. Authenticate Sender: Must be an ACTIVE registered recipient in PASIKA
  const recipient = getTelegramRecipientByChatId(cleanChatId);
  if (!recipient || !recipient.is_active) {
    logTelegramEvent({
      orderId: cleanOrderId,
      chatId: cleanChatId,
      text: `Спроба неавторизованої дії '${action}' над замовленням ${cleanOrderId}`,
      status: "UNAUTHORIZED",
      responseData: { senderUser },
    });

    return {
      success: false,
      error: "UNAUTHORIZED",
      message: "⛔ Доступ заборонено: ваш Telegram акаунт не є авторизованим отримувачем PASIKA або деактивований.",
    };
  }

  // 2. Validate Role Permissions: only owner, admin, or manager can modify orders
  const allowedRoles = ["owner", "admin", "manager"];
  if (!allowedRoles.includes(recipient.role)) {
    return {
      success: false,
      error: "FORBIDDEN",
      message: "⛔ У вас недостатньо прав для виконання цієї дії.",
    };
  }

  // 3. Verify Order Existence in PASIKA SQLite
  const existingOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(cleanOrderId);
  if (!existingOrder) {
    return {
      success: false,
      error: "ORDER_NOT_FOUND",
      message: "⚠️ Замовлення не знайдено в базі даних PASIKA.",
    };
  }

  const currentStatus = existingOrder.status;

  // 4. Map Action to Official PASIKA Status
  // 'accept' -> 'PROCESSING'
  // 'reject' -> 'CANCELLED'
  let targetStatus = null;
  if (action === "accept") {
    targetStatus = "PROCESSING";
  } else if (action === "reject") {
    targetStatus = "CANCELLED";
  } else {
    return {
      success: false,
      error: "INVALID_ACTION",
      message: "⚠️ Невідома дія над замовленням.",
    };
  }

  // 5. Verify Status Transitions
  if (action === "accept") {
    if (currentStatus === "PROCESSING") {
      return {
        success: true,
        alreadyProcessed: true,
        order: existingOrder,
        newStatus: currentStatus,
        message: "ℹ️ Замовлення вже прийнято в роботу.",
      };
    }
    if (currentStatus === "CANCELLED") {
      return {
        success: false,
        error: "STATUS_CONFLICT",
        message: "⚠️ Замовлення було скасовано. Для відновлення скористайтесь адмін-панеллю.",
      };
    }
    if (currentStatus === "COMPLETED") {
      return {
        success: false,
        error: "STATUS_CONFLICT",
        message: "ℹ️ Замовлення вже виконано.",
      };
    }
  }

  if (action === "reject") {
    if (currentStatus === "CANCELLED") {
      return {
        success: true,
        alreadyProcessed: true,
        order: existingOrder,
        newStatus: currentStatus,
        message: "ℹ️ Замовлення вже скасовано.",
      };
    }
    if (currentStatus === "COMPLETED") {
      return {
        success: false,
        error: "STATUS_CONFLICT",
        message: "⚠️ Неможливо відхилити вже виконане замовлення.",
      };
    }
  }

  // 6. Execute atomic SQLite transaction (same business logic as server/orders.js)
  const now = Date.now();
  try {
    const tx = db.transaction(() => {
      // If cancelling, restore product stock
      if (targetStatus === "CANCELLED" && currentStatus !== "CANCELLED") {
        const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(cleanOrderId);
        const restoreStockStmt = db.prepare(
          "UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?"
        );
        for (const item of items) {
          restoreStockStmt.run(item.qty, now, item.product_id);
        }
      }

      // If restoring from cancelled to active, check & deduct stock
      if (currentStatus === "CANCELLED" && targetStatus !== "CANCELLED") {
        const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(cleanOrderId);
        for (const item of items) {
          const prod = db.prepare("SELECT name, stock FROM products WHERE id = ?").get(item.product_id);
          if (prod && prod.stock < item.qty) {
            throw new Error(`Недостатньо товару "${prod.name}" на складі для відновлення`);
          }
        }
        const deductStockStmt = db.prepare(
          "UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?"
        );
        for (const item of items) {
          deductStockStmt.run(item.qty, now, item.product_id);
        }
      }

      db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(
        targetStatus,
        now,
        cleanOrderId
      );
    });

    tx();
  } catch (err) {
    console.error("[Telegram Order Action DB Error]:", err.message);
    return {
      success: false,
      error: "DB_ERROR",
      message: `Помилка збереження: ${err.message}`,
    };
  }

  // 7. Fetch updated order
  const updatedOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(cleanOrderId);
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(cleanOrderId);
  updatedOrder.items = items;

  // 8. Log successful action
  logTelegramEvent({
    orderId: cleanOrderId,
    recipientId: recipient.id,
    chatId: cleanChatId,
    text: `Замовлення #${updatedOrder.number}: статус змінено на ${targetStatus} користувачем ${recipient.name}`,
    status: "ACTION_PROCESSED",
    responseData: { action, prevStatus: currentStatus, newStatus: targetStatus },
  });

  const feedbackText =
    targetStatus === "PROCESSING"
      ? `✅ Замовлення #${updatedOrder.number} прийнято в роботу!`
      : `❌ Замовлення #${updatedOrder.number} відхилено!`;

  return {
    success: true,
    alreadyProcessed: false,
    order: updatedOrder,
    prevStatus: currentStatus,
    newStatus: targetStatus,
    recipient,
    message: feedbackText,
  };
}
