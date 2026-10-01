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

  // Payments lookup
  const paymentRecords = db
    .prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC")
    .all(orderId);

  return {
    id: order.id,
    number: order.number,
    orderCode: order.order_code || `PAS-${order.number}`,
    order_code: order.order_code || `PAS-${order.number}`,
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
      region: order.delivery_region || null,
      branch: order.delivery_branch_name,
      branchId: order.delivery_branch_id,
      branchNumber: order.delivery_branch_number || null,
      warehouseAddress: order.delivery_warehouse_address || null,
      warehouseRef: order.delivery_warehouse_ref || order.delivery_branch_id || null,
      trackingNumber: order.tracking_number || null,
      deliveryService: order.delivery_service || order.delivery_provider || "Нова Пошта",
      trackingUrl,
      shippedAt: order.shipped_at || null,
      completedAt: order.completed_at || null,
    },
    payment: {
      method: order.payment_method,
      methodLabel: order.payment_method === "card" ? "Оплачено наперед" : "Оплата при отриманні",
      paymentStatus:
        order.status === "PAID" || order.status === "COMPLETED" || order.status === "SHIPPED"
          ? "Оплачено"
          : order.status === "CANCELLED"
          ? "Скасовано"
          : order.payment_method === "card"
          ? "Чек на перевірці"
          : "Очікує оплати",
      receiptStatus: order.payment_method === "card" ? (order.receipt_url ? "Прикріплено" : "Очікується") : "Не потрібен",
      records: paymentRecords.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        confirmedBy: p.confirmed_by,
        confirmedAt: p.confirmed_at,
        createdAt: p.created_at,
      })),
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

    const nameParts = (req.body?.name || rawCustomer.name || req.body?.fullName || rawCustomer.fullName || "").trim().split(/\s+/);
    const firstName = req.body?.firstName || rawCustomer.firstName || (nameParts[0] || "");
    const lastName = req.body?.lastName || rawCustomer.lastName || (nameParts.slice(1).join(" ") || "");
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
    const cityId = typeof city === "object" ? city.id : (req.body?.cityRef || req.body?.deliveryCityId || rawDelivery.cityId || null);
    const branchName = typeof branch === "object" ? branch.name : branch;
    const branchId = typeof branch === "object" ? (branch.id || branch.ref) : (req.body?.branchRef || req.body?.deliveryBranchId || rawDelivery.branchId || null);

    const deliveryRegion = req.body?.deliveryRegion || req.body?.region || rawDelivery.region || (typeof city === "object" ? (city.area || city.region) : null) || null;
    const deliveryWarehouseAddress = req.body?.deliveryWarehouseAddress || req.body?.warehouseAddress || rawDelivery.warehouseAddress || (typeof branch === "object" ? (branch.address || branch.shortAddress) : null) || null;
    const deliveryWarehouseRef = req.body?.deliveryWarehouseRef || req.body?.warehouseRef || rawDelivery.warehouseRef || branchId || null;
    const deliveryBranchNumber = req.body?.deliveryBranchNumber || req.body?.branchNumber || rawDelivery.branchNumber || (typeof branch === "object" ? branch.number : null) || null;

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
      const q = Number(item.qty != null ? item.qty : item.quantity);
      if (!item.id || !Number.isInteger(q) || q <= 0) {
        return res.status(400).json({ error: "Некоректні товари у кошику" });
      }
      item.qty = q;
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

    // Execute atomic transaction: stock check, stock reservation, order & items insert, claim receipt
    const orderId = "o_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex");
    const now = Date.now();
    let calculatedTotal = 0;
    let newOrderNumber = 10001;
    let newOrderCode = "PAS-10001";

    const createTx = db.transaction(() => {
      // Check available stock & lock items
      const resolvedItems = [];
      for (const item of items) {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.id);
        if (!product) {
          throw new Error(`Товар з кодом ${item.id} не знайдено`);
        }
        const requestedQty = Number(item.qty);
        const totalStock = Number(product.stock) || 0;
        const reservedStock = Number(product.reserved_stock) || 0;
        const availableStock = Math.max(0, totalStock - reservedStock);

        if (availableStock < requestedQty) {
          throw new Error(
            `Недостатньо доступного товару "${product.name}" на складі (в наявності доступно ${availableStock} шт., запитано ${requestedQty} шт.)`
          );
        }
        calculatedTotal += product.price * requestedQty;
        resolvedItems.push({
          product,
          qty: requestedQty,
        });
      }

      // Next sequential order number (PAS-10001 format)
      const numRow = db.prepare("SELECT COALESCE(MAX(number), 10000) AS max_num FROM orders").get();
      newOrderNumber = Math.max(Number(numRow?.max_num || 10000) + 1, 10001);
      newOrderCode = `PAS-${newOrderNumber}`;

      // Reserve stock (stock stays unchanged until packed/shipped, reserved_stock increases)
      const updateReservedStmt = db.prepare(`
        UPDATE products
        SET reserved_stock = reserved_stock + ?, updated_at = ?
        WHERE id = ?
      `);
      for (const entry of resolvedItems) {
        updateReservedStmt.run(entry.qty, now, entry.product.id);
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

      // Also ensure customer exists in users table
      try {
        db.prepare(`
          INSERT OR IGNORE INTO users (id, phone, first_name, last_name, email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run("u_" + customerId, normalizedPhone, cleanFirst, cleanLast, cleanEmail || null, now, now);
      } catch {}

      // Mark receipt as claimed if uploaded during checkout
      if (rawReceiptPath && checkoutToken) {
        const receiptFilename = rawReceiptPath.split("/").pop();
        db.prepare(`
          UPDATE pending_receipts
          SET claimed = 1
          WHERE checkout_token = ? AND filename = ?
        `).run(checkoutToken, receiptFilename);
      }

      const initialStatus = cleanPayment === "card" ? "AWAITING_PAYMENT" : "NEW";

      // Insert order with customer_id, delivery_service and order_code
      db.prepare(`
        INSERT INTO orders (
          id, number, order_code, status, customer_first_name, customer_last_name,
          customer_phone, customer_email, customer_id, total, delivery_provider,
          delivery_provider_key, delivery_city_id, delivery_city_name,
          delivery_branch_id, delivery_branch_name, delivery_service, payment_method,
          comment, receipt_url, receipt_name, idempotency_key, customer_token,
          delivery_region, delivery_warehouse_address, delivery_warehouse_ref, delivery_branch_number,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        newOrderNumber,
        newOrderCode,
        initialStatus,
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
        deliveryRegion,
        deliveryWarehouseAddress,
        deliveryWarehouseRef,
        deliveryBranchNumber,
        now,
        now
      );

      // Record in stock_reservations table (references orders.id)
      const insertResStmt = db.prepare(`
        INSERT INTO stock_reservations (id, order_id, product_id, qty, status, created_at, expires_at)
        VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
      `);
      for (const entry of resolvedItems) {
        const resId = "sr_" + crypto.randomBytes(8).toString("hex");
        insertResStmt.run(resId, orderId, entry.product.id, entry.qty, now, now + 48 * 3600 * 1000);
      }


      // Record in payments table
      const paymentId = "pay_" + crypto.randomBytes(8).toString("hex");
      db.prepare(`
        INSERT INTO payments (
          id, order_id, amount, method, status, receipt_url, receipt_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentId,
        orderId,
        calculatedTotal,
        cleanPayment,
        cleanPayment === "card" ? "PENDING" : "PENDING_COD",
        rawReceiptPath || null,
        finalReceiptName || null,
        now
      );

      // Record initial creation in status history
      const historyId = "osh_" + crypto.randomBytes(8).toString("hex");
      const historyComment =
        cleanPayment === "card"
          ? "Замовлення оформлено (очікує підтвердження оплати за чеком)"
          : "Замовлення оформлено на сайті";

      db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        historyId,
        orderId,
        null,
        initialStatus,
        historyComment,
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
  const numVal = Number(id);
  let rawOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!rawOrder && !isNaN(numVal) && numVal > 0) {
    rawOrder = db.prepare("SELECT * FROM orders WHERE number = ?").get(numVal);
  }
  if (!rawOrder) {
    rawOrder = db.prepare("SELECT * FROM orders WHERE order_code = ?").get(id);
  }

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

  const order = getFullOrder(rawOrder.id, rawOrder.customer_token);
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
      order_code LIKE ? OR
      customer_first_name LIKE ? OR
      customer_last_name LIKE ? OR
      customer_phone LIKE ? OR
      customer_email LIKE ? OR
      delivery_city_name LIKE ? OR
      tracking_number LIKE ?
    )`;
    params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
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

    const ALLOWED_STATUSES = [
      "NEW",
      "PROCESSING",
      "AWAITING_PAYMENT",
      "PAID",
      "PACKED",
      "SHIPMENT_CREATED",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Некоректний статус замовлення" });
    }

    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const prevStatus = existing.status;
    const now = Date.now();
    const adminUser = req.admin?.username || "admin";

    const updateTx = db.transaction(() => {
      // 1. If transitioning to CANCELLED: release reservations
      if (status === "CANCELLED" && prevStatus !== "CANCELLED") {
        const reservations = db.prepare("SELECT * FROM stock_reservations WHERE order_id = ?").all(id);
        for (const resv of reservations) {
          if (resv.status === "ACTIVE") {
            db.prepare(`
              UPDATE products
              SET reserved_stock = MAX(0, reserved_stock - ?), updated_at = ?
              WHERE id = ?
            `).run(resv.qty, now, resv.product_id);
            db.prepare("UPDATE stock_reservations SET status = 'RELEASED' WHERE id = ?").run(resv.id);
          } else if (resv.status === "FULFILLED") {
            // Already fulfilled/deducted: return stock back
            db.prepare(`
              UPDATE products
              SET stock = stock + ?, updated_at = ?
              WHERE id = ?
            `).run(resv.qty, now, resv.product_id);
            db.prepare("UPDATE stock_reservations SET status = 'RELEASED' WHERE id = ?").run(resv.id);
          }
        }
      }
      // 2. If restoring from CANCELLED to an active status: re-reserve stock
      else if (prevStatus === "CANCELLED" && status !== "CANCELLED") {
        const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(id);
        for (const item of items) {
          const prod = db.prepare("SELECT name, stock, reserved_stock FROM products WHERE id = ?").get(item.product_id);
          if (!prod) throw new Error(`Товар ${item.product_id} не знайдено`);
          const avail = Math.max(0, (prod.stock || 0) - (prod.reserved_stock || 0));
          if (avail < item.qty) {
            throw new Error(`Недостатньо доступного товару "${prod.name}" на складі (доступно ${avail} шт., потрібно ${item.qty} шт.)`);
          }
        }
        for (const item of items) {
          db.prepare(`
            UPDATE products SET reserved_stock = reserved_stock + ?, updated_at = ? WHERE id = ?
          `).run(item.qty, now, item.product_id);
          const resId = "sr_" + crypto.randomBytes(8).toString("hex");
          db.prepare(`
            INSERT INTO stock_reservations (id, order_id, product_id, qty, status, created_at, expires_at)
            VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
          `).run(resId, id, item.product_id, item.qty, now, now + 48 * 3600 * 1000);
        }
      }

      // 3. If transitioning to PACKED, SHIPMENT_CREATED, SHIPPED, DELIVERED, COMPLETED:
      // Fulfill active reservations (deduct stock, decrement reserved_stock, mark FULFILLED)
      const FULFILL_STATUSES = ["PACKED", "SHIPMENT_CREATED", "SHIPPED", "DELIVERED", "COMPLETED"];
      if (FULFILL_STATUSES.includes(status)) {
        const activeResvs = db.prepare("SELECT * FROM stock_reservations WHERE order_id = ? AND status = 'ACTIVE'").all(id);
        for (const resv of activeResvs) {
          db.prepare(`
            UPDATE products
            SET stock = MAX(0, stock - ?),
                reserved_stock = MAX(0, reserved_stock - ?),
                updated_at = ?
            WHERE id = ?
          `).run(resv.qty, resv.qty, now, resv.product_id);

          db.prepare("UPDATE stock_reservations SET status = 'FULFILLED' WHERE id = ?").run(resv.id);
        }
      }

      // 4. If status is PAID: update payments table
      if (status === "PAID") {
        db.prepare(`
          UPDATE payments
          SET status = 'PAID', confirmed_at = ?, confirmed_by = ?
          WHERE order_id = ?
        `).run(now, adminUser, id);
      }

      // 5. Shipped and completed dates
      let shippedAt = existing.shipped_at;
      let completedAt = existing.completed_at;
      if ((status === "SHIPPED" || status === "SHIPMENT_CREATED") && !shippedAt) {
        shippedAt = now;
      }
      if ((status === "COMPLETED" || status === "DELIVERED") && !completedAt) {
        completedAt = now;
      }

      db.prepare(`
        UPDATE orders
        SET status = ?, shipped_at = ?, completed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(status, shippedAt, completedAt, now, id);

      // 6. Record in status history
      const historyId = "osh_" + crypto.randomBytes(8).toString("hex");
      const historyComment = comment || `Зміна статусу з ${prevStatus} на ${status}`;
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(historyId, id, prevStatus, status, historyComment, adminUser, now);
    });

    updateTx();

    const updated = getFullOrder(id);

    // Trigger Telegram status update notification in background if status changed
    if (prevStatus !== status) {
      notifyOrderStatusChange(updated, prevStatus, status, adminUser).catch((err) => {
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

export function confirmOrderPayment(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const now = Date.now();
    const prevStatus = existing.status;
    const adminUser = req.admin?.username || "admin";

    db.transaction(() => {
      // 1. Update order status to PAID
      db.prepare(`
        UPDATE orders
        SET status = 'PAID', updated_at = ?
        WHERE id = ?
      `).run(now, id);

      // 2. Update or insert payment record
      const pay = db.prepare("SELECT id FROM payments WHERE order_id = ?").get(id);
      if (pay) {
        db.prepare(`
          UPDATE payments
          SET status = 'PAID', confirmed_at = ?, confirmed_by = ?
          WHERE id = ?
        `).run(now, adminUser, pay.id);
      } else {
        const payId = "pay_" + crypto.randomBytes(8).toString("hex");
        db.prepare(`
          INSERT INTO payments (id, order_id, amount, method, status, confirmed_by, confirmed_at, created_at)
          VALUES (?, ?, ?, ?, 'PAID', ?, ?, ?)
        `).run(payId, id, existing.total, existing.payment_method, adminUser, now, now);
      }

      // 3. Status history
      const hid = "osh_" + crypto.randomBytes(8).toString("hex");
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, 'PAID', 'Оплату перевірено та підтверджено адміністратором', ?, ?)
      `).run(hid, id, prevStatus, adminUser, now);
    })();

    const updated = getFullOrder(id);
    notifyOrderStatusChange(updated, prevStatus, "PAID", adminUser).catch(() => {});

    return res.json({ success: true, order: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export function getPublicOrderTrack(req, res) {
  const query = (req.params.query || "").trim();
  if (!query) {
    return res.status(400).json({ error: "Вкажіть номер замовлення для відстеження" });
  }

  // Support queries like "PAS-10001", "10001", "#10001", or UUID "o_172..."
  const cleanNum = query.replace(/^(PAS-|#)/i, "").trim();
  const numVal = Number(cleanNum);

  let rawOrder = null;
  if (!isNaN(numVal) && numVal > 0) {
    rawOrder = db.prepare("SELECT * FROM orders WHERE number = ? OR order_code = ? OR id = ?").get(numVal, query, query);
  }
  if (!rawOrder) {
    rawOrder = db.prepare("SELECT * FROM orders WHERE order_code = ? OR id = ?").get(query, query);
  }

  if (!rawOrder) {
    return res.status(404).json({ error: "Замовлення за вказаним номером не знайдено" });
  }

  const items = db.prepare("SELECT name, weight, price, qty FROM order_items WHERE order_id = ?").all(rawOrder.id);
  const statusHistory = db.prepare(
    "SELECT from_status, to_status, comment, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC"
  ).all(rawOrder.id);

  const STATUS_UA = {
    NEW: "Нове",
    PROCESSING: "В обробці",
    AWAITING_PAYMENT: "Очікує оплати / перевірки чека",
    PAID: "Оплачено",
    PACKED: "Запаковано",
    SHIPMENT_CREATED: "Створено ТТН",
    SHIPPED: "Відправлено",
    DELIVERED: "Доставлено",
    COMPLETED: "Виконано",
    CANCELLED: "Скасовано",
  };

  const deliveryService = rawOrder.delivery_service || rawOrder.delivery_provider || "Нова Пошта";
  let trackingUrl = null;
  if (rawOrder.tracking_number) {
    const isUp = deliveryService.toLowerCase().includes("укр");
    trackingUrl = isUp
      ? `https://track.ukrposhta.ua/tracking_UA.html?barcode=${encodeURIComponent(rawOrder.tracking_number)}`
      : `https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(rawOrder.tracking_number)}`;
  }

  return res.json({
    orderCode: rawOrder.order_code || `PAS-${rawOrder.number}`,
    number: rawOrder.number,
    createdAt: rawOrder.created_at,
    updatedAt: rawOrder.updated_at,
    status: rawOrder.status,
    statusLabel: STATUS_UA[rawOrder.status] || rawOrder.status,
    total: rawOrder.total,
    delivery: {
      service: deliveryService,
      city: rawOrder.delivery_city_name,
      region: rawOrder.delivery_region || null,
      branch: rawOrder.delivery_branch_name,
      warehouseAddress: rawOrder.delivery_warehouse_address || null,
      warehouseRef: rawOrder.delivery_warehouse_ref || null,
      branchNumber: rawOrder.delivery_branch_number || null,
      trackingNumber: rawOrder.tracking_number || null,
      trackingUrl,
      shippedAt: rawOrder.shipped_at || null,
      completedAt: rawOrder.completed_at || null,
    },
    items: items.map((i) => ({
      name: i.name,
      weight: i.weight,
      qty: i.qty,
      price: i.price,
    })),
    statusHistory: statusHistory.map((h) => ({
      fromStatus: h.from_status,
      toStatus: h.to_status,
      comment: h.comment,
      createdAt: h.created_at,
    })),
  });
}
