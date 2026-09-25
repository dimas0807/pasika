import crypto from "node:crypto";
import { getSession } from "./auth.js";
import { db } from "./db.js";
import { sendOrderTelegramNotification, notifyOrderStatusChange } from "./telegram.js";

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

  // Customer statistics lookup
  let customerStats = null;
  if (order.customer_id) {
    const cust = db.prepare("SELECT * FROM customers WHERE id = ?").get(order.customer_id);
    if (cust) {
      customerStats = {
        id: cust.id,
        totalOrders: cust.total_orders,
        totalSpent: cust.total_spent,
        firstOrderAt: cust.first_order_at,
        lastOrderAt: cust.last_order_at,
      };
    }
  }

  // Status history timeline
  const statusHistory = db
    .prepare(
      "SELECT id, from_status, to_status, comment, changed_by, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC"
    )
    .all(orderId);

  // Tracking URL builder
  let trackingUrl = null;
  if (order.tracking_number) {
    const isUp =
      order.delivery_provider_key === "up" ||
      (order.delivery_service && order.delivery_service.toLowerCase().includes("укр"));
    trackingUrl = isUp
      ? `https://track.ukrposhta.ua/tracking_UA.html?barcode=${encodeURIComponent(order.tracking_number)}`
      : `https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(order.tracking_number)}`;
  }

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    total: order.total,
    customerId: order.customer_id || null,
    customer: {
      id: order.customer_id || null,
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      phone: order.customer_phone,
      email: order.customer_email || "",
      totalOrders: customerStats?.totalOrders || 1,
      totalSpent: customerStats?.totalSpent || order.total,
    },
    delivery: {
      provider: order.delivery_provider,
      providerKey: order.delivery_provider_key,
      city: order.delivery_city_name,
      cityId: order.delivery_city_id,
      branch: order.delivery_branch_name,
      branchId: order.delivery_branch_id,
      trackingNumber: order.tracking_number || null,
      deliveryService: order.delivery_service || order.delivery_provider || "Нова Пошта",
      trackingUrl,
      shippedAt: order.shipped_at || null,
      completedAt: order.completed_at || null,
    },
    payment: {
      method: order.payment_method,
      methodLabel: order.payment_method === "card" ? "Оплачено наперед" : "Оплата при отриманні",
      paymentStatus: order.payment_method === "card" ? "Чек на перевірці" : "Очікує оплати",
      receiptStatus: order.payment_method === "card" ? (order.receipt_url ? "Прикріплено" : "Очікується") : "Не потрібен",
    },
    comment: order.comment || "",
    receipt: (order.payment_method === "card" && order.receipt_url)
      ? {
          fileUrl: receiptAccessUrl,
          rawUrl: order.receipt_url,
          name: order.receipt_name || "Чек",
        }
      : null,
    deletedAt: order.deleted_at || null,
    isDeleted: Boolean(order.deleted_at),
    statusHistory: statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.from_status,
      toStatus: h.to_status,
      comment: h.comment,
      changedBy: h.changed_by,
      createdAt: h.created_at,
    })),
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

    if (cleanPayment === "card" && !rawReceiptPath) {
      return res.status(400).json({
        error: "Для способу «Оплатити зараз» обов'язково завантажте чек про оплату",
      });
    }

    let finalReceiptName = receiptName;
    if (cleanPayment === "cod") {
      rawReceiptPath = null;
      finalReceiptName = null;
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

      // Customer deduplication & persistent profile linking by normalized phone
      let customer = db.prepare("SELECT * FROM customers WHERE phone = ?").get(normalizedPhone);
      let customerId;
      if (customer) {
        customerId = customer.id;
        db.prepare(`
          UPDATE customers
          SET first_name = COALESCE(NULLIF(?, ''), first_name),
              last_name = COALESCE(NULLIF(?, ''), last_name),
              email = COALESCE(NULLIF(?, ''), email),
              total_orders = total_orders + 1,
              total_spent = total_spent + ?,
              last_order_at = ?,
              updated_at = ?
          WHERE id = ?
        `).run(cleanFirst, cleanLast, cleanEmail || "", calculatedTotal, now, now, customerId);
      } else {
        customerId = "c_" + Date.now().toString(36) + "_" + crypto.randomBytes(3).toString("hex");
        db.prepare(`
          INSERT INTO customers (
            id, phone, first_name, last_name, email,
            total_orders, total_spent, first_order_at, last_order_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          customerId,
          normalizedPhone,
          cleanFirst,
          cleanLast,
          cleanEmail || null,
          1,
          calculatedTotal,
          now,
          now,
          now,
          now
        );
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

      // Insert order with customer_id and delivery_service
      db.prepare(`
        INSERT INTO orders (
          id, number, status, customer_first_name, customer_last_name,
          customer_phone, customer_email, customer_id, total, delivery_provider,
          delivery_provider_key, delivery_city_id, delivery_city_name,
          delivery_branch_id, delivery_branch_name, delivery_service, payment_method,
          comment, receipt_url, receipt_name, idempotency_key, customer_token,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        newOrderNumber,
        "NEW",
        cleanFirst,
        cleanLast,
        normalizedPhone,
        cleanEmail || null,
        customerId,
        calculatedTotal,
        providerName,
        cleanProviderKey,
        cityId,
        cityName,
        branchId,
        branchName,
        providerName,
        cleanPayment,
        comment?.trim() || null,
        rawReceiptPath || null,
        finalReceiptName || null,
        idempotencyKey || null,
        customerToken,
        now,
        now
      );

      // Record initial creation in status history
      const historyId = "osh_" + crypto.randomBytes(8).toString("hex");
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        historyId,
        orderId,
        null,
        "NEW",
        "Замовлення оформлено на сайті",
        "customer",
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
  const { status, deleted, search, customerId, startDate, endDate } = req.query;

  let query = "SELECT id FROM orders WHERE 1=1";
  const params = [];

  // Soft delete filter: active by default, or deleted only
  if (deleted === "true" || deleted === "only") {
    query += " AND deleted_at IS NOT NULL";
  } else if (deleted === "all") {
    // include both active and soft-deleted
  } else {
    // default: active orders only
    query += " AND deleted_at IS NULL";
  }

  if (status && status !== "all") {
    query += " AND status = ?";
    params.push(status);
  }

  if (customerId) {
    query += " AND customer_id = ?";
    params.push(customerId);
  }

  if (startDate) {
    const sTime = Number(startDate);
    if (!isNaN(sTime)) {
      query += " AND created_at >= ?";
      params.push(sTime);
    }
  }

  if (endDate) {
    const eTime = Number(endDate);
    if (!isNaN(eTime)) {
      query += " AND created_at <= ?";
      params.push(eTime);
    }
  }

  if (search && search.trim()) {
    const q = search.trim();
    const pattern = `%${q}%`;
    query += ` AND (
      CAST(number AS TEXT) LIKE ? OR
      customer_first_name LIKE ? OR
      customer_last_name LIKE ? OR
      customer_phone LIKE ? OR
      customer_email LIKE ? OR
      delivery_city_name LIKE ? OR
      tracking_number LIKE ?
    )`;
    params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
  }

  query += " ORDER BY created_at DESC";

  const rows = db.prepare(query).all(...params);
  const orders = rows.map((r) => getFullOrder(r.id)).filter(Boolean);
  return res.json(orders);
}

export function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, comment } = req.body || {};

    const ALLOWED_STATUSES = ["NEW", "PROCESSING", "PACKED", "SHIPPED", "COMPLETED", "CANCELLED"];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Некоректний статус замовлення" });
    }

    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const prevStatus = existing.status;
    const now = Date.now();

    const updateTx = db.transaction(() => {
      // If transitioning to CANCELLED from another status, restore product stock
      if (status === "CANCELLED" && prevStatus !== "CANCELLED") {
        const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(id);
        const restoreStockStmt = db.prepare("UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?");
        for (const item of items) {
          restoreStockStmt.run(item.qty, now, item.product_id);
        }
      }
      // If restoring from CANCELLED to an active status, check stock FIRST before deducting!
      else if (prevStatus === "CANCELLED" && status !== "CANCELLED") {
        const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(id);

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
        for (const item of items) {
          deductStockStmt.run(item.qty, now, item.product_id);
        }
      }

      // Record shipped_at or completed_at dates if transitioning to those statuses
      let shippedAt = existing.shipped_at;
      let completedAt = existing.completed_at;
      if (status === "SHIPPED" && !shippedAt) {
        shippedAt = now;
      }
      if (status === "COMPLETED" && !completedAt) {
        completedAt = now;
      }

      db.prepare(`
        UPDATE orders
        SET status = ?, shipped_at = ?, completed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(status, shippedAt, completedAt, now, id);

      // Record in status history
      const historyId = "osh_" + crypto.randomBytes(8).toString("hex");
      const historyComment = comment || `Зміна статусу з ${prevStatus} на ${status}`;
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(historyId, id, prevStatus, status, historyComment, "admin", now);
    });

    updateTx();

    const updated = getFullOrder(id);

    // Trigger Telegram status update notification in background if status changed
    if (prevStatus !== status) {
      notifyOrderStatusChange(updated, prevStatus, status).catch((err) => {
        console.warn("[Telegram Status Notification Error]:", err.message);
      });
    }

    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export function updateOrderTracking(req, res) {
  try {
    const { id } = req.params;
    const { trackingNumber, deliveryService, setShipped } = req.body || {};

    const cleanTracking = String(trackingNumber || "").trim();
    const cleanService = (deliveryService || "").trim() || "Нова Пошта";

    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const now = Date.now();
    let newStatus = existing.status;
    const shouldShip =
      setShipped === true ||
      (cleanTracking && (existing.status === "NEW" || existing.status === "PROCESSING" || existing.status === "PACKED"));

    if (shouldShip) {
      newStatus = "SHIPPED";
    }

    const shippedAt = shouldShip || existing.shipped_at ? (existing.shipped_at || now) : null;

    db.transaction(() => {
      db.prepare(`
        UPDATE orders
        SET tracking_number = ?,
            delivery_service = ?,
            status = ?,
            shipped_at = ?,
            updated_at = ?
        WHERE id = ?
      `).run(cleanTracking || null, cleanService, newStatus, shippedAt, now, id);

      const hid = "osh_" + crypto.randomBytes(8).toString("hex");
      const comment = cleanTracking
        ? `Оновлено ТТН: ${cleanTracking} (${cleanService})`
        : `Змінено службу доставки: ${cleanService}`;

      db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(hid, id, existing.status, newStatus, comment, "admin", now);
    })();

    const updated = getFullOrder(id);

    // Notify Telegram if tracking added or status changed
    if (newStatus !== existing.status || cleanTracking) {
      notifyOrderStatusChange(updated, existing.status, newStatus).catch(() => {});
    }

    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export function softDeleteOrder(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const now = Date.now();
    db.transaction(() => {
      db.prepare("UPDATE orders SET deleted_at = ?, updated_at = ? WHERE id = ?").run(now, now, id);
      const hid = "osh_" + crypto.randomBytes(8).toString("hex");
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(hid, id, existing.status, existing.status, "Замовлення переміщено до кошика видалених (soft delete)", "admin", now);
    })();

    return res.json({ success: true, id, deletedAt: now });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export function restoreOrder(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const now = Date.now();
    db.transaction(() => {
      db.prepare("UPDATE orders SET deleted_at = NULL, updated_at = ? WHERE id = ?").run(now, id);
      const hid = "osh_" + crypto.randomBytes(8).toString("hex");
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(hid, id, existing.status, existing.status, "Замовлення відновлено з кошика видалених", "admin", now);
    })();

    const restored = getFullOrder(id);
    return res.json({ success: true, order: restored });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
