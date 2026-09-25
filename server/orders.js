import crypto from "node:crypto";
import { getSession } from "./auth.js";
import { db } from "./db.js";
import { sendOrderTelegramNotification } from "./telegram.js";

// Normalize Ukrainian phone numbers
export function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return "+38" + digits;
  }
  if (digits.length === 11 && digits.startsWith("80")) {
    return "+3" + digits;
  }
  if (digits.length === 12 && digits.startsWith("380")) {
    return "+" + digits;
  }
  return null;
}

export function validateEmail(raw) {
  if (!raw) return true; // optional
  const email = String(raw).trim();
  if (email.length === 0) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getFullOrder(orderId, customerToken = null) {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!order) return null;

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);

  // If customer token matches, append token to receipt url for secure access
  let receiptAccessUrl = order.receipt_url;
  if (order.receipt_url && (customerToken || order.customer_token)) {
    const t = customerToken || order.customer_token;
    receiptAccessUrl = `${order.receipt_url}?token=${t}`;
  }

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    total: order.total,
    customer: {
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      phone: order.customer_phone,
      email: order.customer_email || "",
    },
    delivery: {
      provider: order.delivery_provider,
      providerKey: order.delivery_provider_key,
      city: order.delivery_city_name,
      cityId: order.delivery_city_id,
      branch: order.delivery_branch_name,
      branchId: order.delivery_branch_id,
    },
    payment: {
      method: order.payment_method,
    },
    comment: order.comment || "",
    receipt: order.receipt_url
      ? {
          fileUrl: receiptAccessUrl,
          rawUrl: order.receipt_url,
          name: order.receipt_name || "Чек",
        }
      : null,
    items: items.map((i) => ({
      id: i.product_id,
      name: i.name,
      weight: i.weight,
      price: i.price,
      qty: i.qty,
    })),
  };
}

export async function createOrder(req, res) {
  try {
    // Flexible payload extraction: support both nested and flat keys
    const rawCustomer = req.body?.customer || {};
    const rawDelivery = req.body?.delivery || {};
    const rawPayment = req.body?.payment || {};

    const firstName = req.body?.firstName || rawCustomer.firstName;
    const lastName = req.body?.lastName || rawCustomer.lastName;
    const phone = req.body?.phone || rawCustomer.phone;
    const email = req.body?.email || rawCustomer.email;

    const providerKey = req.body?.providerKey || rawDelivery.providerKey;
    const city = req.body?.city || rawDelivery.city;
    const branch = req.body?.branch || rawDelivery.branch;

    const paymentMethod = req.body?.paymentMethod || rawPayment.method;

    const comment = req.body?.comment;
    const receiptUrl = req.body?.receiptUrl || req.body?.receipt?.fileUrl || req.body?.receipt?.dataUrl;
    const receiptName = req.body?.receiptName || req.body?.receipt?.name;
    const items = req.body?.items;
    const idempotencyKey = req.body?.idempotencyKey;
    const checkoutToken = (req.body?.checkoutToken || req.headers["x-checkout-token"] || "").trim();

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = db.prepare("SELECT id, customer_token FROM orders WHERE idempotency_key = ?").get(idempotencyKey);
      if (existing) {
        const full = getFullOrder(existing.id, existing.customer_token);
        return res.status(200).json({
          success: true,
          order: full,
          customerToken: existing.customer_token,
          duplicate: true,
        });
      }
    }

    // 2. Validate Customer Details
    const cleanFirst = (firstName || "").trim();
    const cleanLast = (lastName || "").trim();
    if (!cleanFirst || !cleanLast) {
      return res.status(400).json({ error: "Вкажіть ім'я та прізвище" });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        error: "Введіть коректний номер телефону України (наприклад, +380 67 123 45 67)",
      });
    }

    const cleanEmail = (email || "").trim();
    if (cleanEmail && !validateEmail(cleanEmail)) {
      return res.status(400).json({ error: "Некоректний формат email" });
    }

    // Anti-spam rapid repeat submission check (same phone submitted within 10 seconds)
    const recentDuplicate = db
      .prepare(`
        SELECT id, customer_token FROM orders
        WHERE customer_phone = ? AND created_at > ?
        ORDER BY created_at DESC LIMIT 1
      `)
      .get(normalizedPhone, Date.now() - 10000);

    if (recentDuplicate && idempotencyKey) {
      const full = getFullOrder(recentDuplicate.id, recentDuplicate.customer_token);
      return res.status(200).json({
        success: true,
        order: full,
        customerToken: recentDuplicate.customer_token,
        duplicate: true,
      });
    }

    // 3. Validate Delivery
    const cleanProviderKey = providerKey === "up" ? "up" : "np";
    const providerName = cleanProviderKey === "up" ? "Укрпошта" : "Нова пошта";

    const cityName = typeof city === "object" ? city.name : city;
    const cityId = typeof city === "object" ? city.id : null;
    const branchName = typeof branch === "object" ? branch.name : branch;
    const branchId = typeof branch === "object" ? branch.id : null;

    if (!cityName || !branchName) {
      return res.status(400).json({ error: "Оберіть місто та відділення доставки" });
    }

    // 4. Validate Payment
    const cleanPayment = paymentMethod === "card" ? "card" : "cod";

    // 5. Validate Items & Stock Check
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Кошик порожній" });
    }

    for (const item of items) {
      if (!item.id || !Number.isInteger(Number(item.qty)) || Number(item.qty) <= 0) {
        return res.status(400).json({ error: "Некоректні товари у кошику" });
      }
    }

    // Generate secure customer token for this order
    const customerToken = "ctk_" + crypto.randomBytes(24).toString("hex");

    // Clean receipt URL without query params
    let rawReceiptPath = receiptUrl;
    if (rawReceiptPath && rawReceiptPath.includes("?")) {
      rawReceiptPath = rawReceiptPath.split("?")[0];
    }

    // Execute atomic transaction: stock check, stock deduction, order & items insert, claim receipt
    const orderId = "o_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex");
    const now = Date.now();
    let calculatedTotal = 0;
    let newOrderNumber = 1027;

    const createTx = db.transaction(() => {
      // Check stock & lock items
      const resolvedItems = [];
      for (const item of items) {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.id);
        if (!product) {
          throw new Error(`Товар з кодом ${item.id} не знайдено`);
        }
        const requestedQty = Number(item.qty);
        if (product.stock < requestedQty) {
          throw new Error(
            `Недостатньо товару "${product.name}" на складі (в наявності ${product.stock} шт., запитано ${requestedQty} шт.)`
          );
        }
        calculatedTotal += product.price * requestedQty;
        resolvedItems.push({
          product,
          qty: requestedQty,
        });
      }

      // Next sequential order number
      const numRow = db.prepare("SELECT COALESCE(MAX(number), 1026) + 1 AS next_num FROM orders").get();
      newOrderNumber = numRow.next_num;

      // Deduct stock
      const updateStockStmt = db.prepare(`
        UPDATE products
        SET stock = stock - ?, updated_at = ?
        WHERE id = ?
      `);
      for (const entry of resolvedItems) {
        updateStockStmt.run(entry.qty, now, entry.product.id);
      }

      // Mark receipt as claimed if uploaded during checkout
      if (rawReceiptPath && checkoutToken) {
        const receiptFilename = rawReceiptPath.split("/").pop();
        db.prepare(`
          UPDATE pending_receipts
          SET claimed = 1
          WHERE checkout_token = ? AND filename = ?
        `).run(checkoutToken, receiptFilename);
      }

      // Insert order
      db.prepare(`
        INSERT INTO orders (
          id, number, status, customer_first_name, customer_last_name,
          customer_phone, customer_email, total, delivery_provider,
          delivery_provider_key, delivery_city_id, delivery_city_name,
          delivery_branch_id, delivery_branch_name, payment_method,
          comment, receipt_url, receipt_name, idempotency_key, customer_token,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        newOrderNumber,
        "NEW",
        cleanFirst,
        cleanLast,
        normalizedPhone,
        cleanEmail || null,
        calculatedTotal,
        providerName,
        cleanProviderKey,
        cityId,
        cityName,
        branchId,
        branchName,
        cleanPayment,
        comment?.trim() || null,
        rawReceiptPath || null,
        receiptName || null,
        idempotencyKey || null,
        customerToken,
        now,
        now
      );

      // Insert order items
      const insertItemStmt = db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, name, weight, price, qty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const entry of resolvedItems) {
        const itemId = "oi_" + crypto.randomBytes(6).toString("hex");
        insertItemStmt.run(
          itemId,
          orderId,
          entry.product.id,
          entry.product.name,
          entry.product.weight,
          entry.product.price,
          entry.qty
        );
      }
    });

    createTx();

    const createdOrder = getFullOrder(orderId, customerToken);

    // Trigger Telegram notification in background (won't block HTTP response)
    sendOrderTelegramNotification(createdOrder).catch((err) => {
      console.error("[Telegram Trigger Error]:", err);
    });

    return res.status(201).json({
      success: true,
      order: createdOrder,
      customerToken,
    });
  } catch (err) {
    console.error("[Order Creation Error]:", err.message);
    return res.status(400).json({ error: err.message });
  }
}

export function getPublicOrder(req, res) {
  const { id } = req.params;
  const rawOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);

  if (!rawOrder) {
    return res.status(404).json({ error: "Замовлення не знайдено" });
  }

  // Check admin session
  let adminToken = req.cookies?.pasika_session;
  if (!adminToken && req.headers.authorization?.startsWith("Bearer ")) {
    adminToken = req.headers.authorization.substring(7).trim();
  }
  const adminSession = getSession(adminToken);

  // Check customer token
  const token = (req.query.token || req.headers["x-customer-token"] || "").trim();
  const hasValidCustomerToken = Boolean(token && rawOrder.customer_token && rawOrder.customer_token === token);

  // If neither admin nor valid customer token -> deny access to PII and receipt
  if (!adminSession && !hasValidCustomerToken) {
    return res.status(403).json({
      error: "Доступ до персональних даних замовлення заборонено без дійсного customerToken",
    });
  }

  const order = getFullOrder(id, rawOrder.customer_token);
  return res.json(order);
}

// ---------------- Admin Handlers ----------------
export function getAdminOrders(req, res) {
  const { status } = req.query;
  let rows;
  if (status && status !== "all") {
    rows = db.prepare("SELECT id FROM orders WHERE status = ? ORDER BY created_at DESC").all(status);
  } else {
    rows = db.prepare("SELECT id FROM orders ORDER BY created_at DESC").all();
  }

  const orders = rows.map((r) => getFullOrder(r.id));
  return res.json(orders);
}

export function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const ALLOWED_STATUSES = ["NEW", "PROCESSING", "PACKED", "SHIPPED", "COMPLETED", "CANCELLED"];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Некоректний статус замовлення" });
    }

    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const prevStatus = existing.status;

    const updateTx = db.transaction(() => {
      // If transitioning to CANCELLED from another status, restore product stock
      if (status === "CANCELLED" && prevStatus !== "CANCELLED") {
        const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(id);
        const restoreStockStmt = db.prepare("UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?");
        const now = Date.now();
        for (const item of items) {
          restoreStockStmt.run(item.qty, now, item.product_id);
        }
      }
      // If restoring from CANCELLED to an active status, check stock FIRST before deducting!
      else if (prevStatus === "CANCELLED" && status !== "CANCELLED") {
        const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(id);

        // Pre-check stock inside transaction: prevent negative stock
        for (const item of items) {
          const prod = db.prepare("SELECT name, stock FROM products WHERE id = ?").get(item.product_id);
          if (!prod) {
            throw new Error(`Товар ${item.product_id} не знайдено`);
          }
          if (prod.stock < item.qty) {
            throw new Error(
              `Недостатньо товару "${prod.name}" на складі для відновлення замовлення (доступно ${prod.stock} шт., потрібно ${item.qty} шт.)`
            );
          }
        }

        const deductStockStmt = db.prepare("UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?");
        const now = Date.now();
        for (const item of items) {
          deductStockStmt.run(item.qty, now, item.product_id);
        }
      }

      db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(status, Date.now(), id);
    });

    updateTx();

    const updated = getFullOrder(id);
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
