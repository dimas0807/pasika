import crypto from "node:crypto";
import { db } from "../db.js";
import { novaPoshtaProvider } from "./NovaPoshtaProvider.js";
import { ukrposhtaProvider } from "./UkrposhtaProvider.js";

export { DeliveryProvider } from "./DeliveryProvider.js";
export { NovaPoshtaProvider, novaPoshtaProvider } from "./NovaPoshtaProvider.js";
export { UkrposhtaProvider, ukrposhtaProvider } from "./UkrposhtaProvider.js";

/**
 * Resolves active API key for a delivery provider
 * Priority:
 * 1. Explicit active Delivery Account from database
 * 2. Settings table (app_settings)
 * 3. Environment variables (NOVA_POSHTA_API_KEY, UKRPOSHTA_API_KEY)
 */
export function getActiveApiKey(provider = "np") {
  const norm = provider.toLowerCase().startsWith("up") ? "up" : "np";

  // 1. Check delivery_accounts table
  try {
    const acc = db
      .prepare(`
        SELECT api_key FROM delivery_accounts
        WHERE provider = ? AND is_active = 1
        ORDER BY is_default DESC, created_at ASC
        LIMIT 1
      `)
      .get(norm);
    if (acc?.api_key?.trim()) {
      return acc.api_key.trim();
    }
  } catch {}

  // 2. Check settings table
  try {
    const sRow = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
    if (sRow) {
      const parsed = JSON.parse(sRow.value);
      if (norm === "np" && parsed.delivery?.novaPoshtaApiKey) {
        return String(parsed.delivery.novaPoshtaApiKey).trim();
      }
      if (norm === "up" && parsed.delivery?.ukrposhtaApiKey) {
        return String(parsed.delivery.ukrposhtaApiKey).trim();
      }
    }
  } catch {}

  // 3. Check environment variables
  if (norm === "np") {
    return (process.env.NOVA_POSHTA_API_KEY || "").trim();
  }
  return (process.env.UKRPOSHTA_API_KEY || "").trim();
}

/**
 * Delivery Accounts Management
 */
export function getDeliveryAccounts(provider = null) {
  try {
    let sql = "SELECT * FROM delivery_accounts";
    const params = [];
    if (provider) {
      const norm = provider.toLowerCase().startsWith("up") ? "up" : "np";
      sql += " WHERE provider = ?";
      params.push(norm);
    }
    sql += " ORDER BY is_default DESC, created_at ASC";
    const rows = db.prepare(sql).all(...params);
    return rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      name: r.name,
      senderName: r.sender_name,
      phone: r.phone,
      cityRef: r.city_ref,
      cityName: r.city_name,
      warehouseRef: r.warehouse_ref,
      warehouseName: r.warehouse_name,
      isActive: Boolean(r.is_active),
      isDefault: Boolean(r.is_default),
      hasApiKey: Boolean(r.api_key),
      apiKeyMasked: r.api_key ? "••••••••••••••••" : "",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch {
    return [];
  }
}

export function createDeliveryAccount(data) {
  const norm = (data.provider || "np").toLowerCase().startsWith("up") ? "up" : "np";
  const id = "da_" + Date.now().toString(36) + "_" + crypto.randomBytes(3).toString("hex");
  const now = Date.now();
  const apiKey = (data.apiKey || "").trim() || getActiveApiKey(norm);

  if (!data.name?.trim()) {
    throw new Error("Вкажіть назву акаунта доставки");
  }

  // If this is marked default, unset existing defaults for provider
  if (data.isDefault) {
    db.prepare("UPDATE delivery_accounts SET is_default = 0 WHERE provider = ?").run(norm);
  }

  db.prepare(`
    INSERT INTO delivery_accounts (
      id, provider, name, api_key, sender_ref, sender_name,
      phone, city_ref, city_name, warehouse_ref, warehouse_name,
      is_active, is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    norm,
    data.name.trim(),
    apiKey,
    data.senderRef || null,
    data.senderName || null,
    data.phone || null,
    data.cityRef || null,
    data.cityName || null,
    data.warehouseRef || null,
    data.warehouseName || null,
    data.isActive !== false ? 1 : 0,
    data.isDefault ? 1 : 0,
    now,
    now
  );

  return db.prepare("SELECT * FROM delivery_accounts WHERE id = ?").get(id);
}

export function updateDeliveryAccount(id, data) {
  const existing = db.prepare("SELECT * FROM delivery_accounts WHERE id = ?").get(id);
  if (!existing) {
    throw new Error("Акаунт доставки не знайдено");
  }

  const now = Date.now();
  let apiKey = existing.api_key;
  if (data.apiKey && data.apiKey !== "••••••••••••••••") {
    apiKey = data.apiKey.trim();
  }

  if (data.isDefault) {
    db.prepare("UPDATE delivery_accounts SET is_default = 0 WHERE provider = ?").run(existing.provider);
  }

  db.prepare(`
    UPDATE delivery_accounts
    SET name = ?,
        api_key = ?,
        sender_ref = ?,
        sender_name = ?,
        phone = ?,
        city_ref = ?,
        city_name = ?,
        warehouse_ref = ?,
        warehouse_name = ?,
        is_active = ?,
        is_default = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    data.name ? data.name.trim() : existing.name,
    apiKey,
    data.senderRef !== undefined ? data.senderRef : existing.sender_ref,
    data.senderName !== undefined ? data.senderName : existing.sender_name,
    data.phone !== undefined ? data.phone : existing.phone,
    data.cityRef !== undefined ? data.cityRef : existing.city_ref,
    data.cityName !== undefined ? data.cityName : existing.city_name,
    data.warehouseRef !== undefined ? data.warehouseRef : existing.warehouse_ref,
    data.warehouseName !== undefined ? data.warehouseName : existing.warehouse_name,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing.is_active,
    data.isDefault !== undefined ? (data.isDefault ? 1 : 0) : existing.is_default,
    now,
    id
  );

  return db.prepare("SELECT * FROM delivery_accounts WHERE id = ?").get(id);
}

export function deleteDeliveryAccount(id) {
  const res = db.prepare("DELETE FROM delivery_accounts WHERE id = ?").run(id);
  return res.changes > 0;
}

/**
 * Public City & Branch searches
 */
export async function searchCitiesNovaPoshta(query) {
  const apiKey = getActiveApiKey("np");
  return await novaPoshtaProvider.searchCities(query, apiKey);
}

export async function getBranchesNovaPoshta(cityId, search = "") {
  const apiKey = getActiveApiKey("np");
  return await novaPoshtaProvider.getWarehouses(cityId, apiKey, search);
}

export async function searchCitiesUkrposhta(query) {
  const apiKey = getActiveApiKey("up");
  return await ukrposhtaProvider.searchCities(query, apiKey);
}

export async function getBranchesUkrposhta(cityId) {
  const apiKey = getActiveApiKey("up");
  return await ukrposhtaProvider.getWarehouses(cityId, apiKey);
}

/**
 * Check API Status
 */
export async function checkDeliveryApi(provider, customKey = null) {
  const norm = provider.toLowerCase().startsWith("up") ? "up" : "np";
  const apiKey = customKey !== null && customKey !== undefined && customKey !== "••••••••••••••••"
    ? customKey.trim()
    : getActiveApiKey(norm);

  if (!apiKey) {
    return {
      ok: false,
      status: "not_configured",
      message: "API key не налаштований",
      error: "API key не налаштований",
    };
  }

  if (norm === "np") {
    return await novaPoshtaProvider.checkApi(apiKey);
  }
  return await ukrposhtaProvider.checkApi(apiKey);
}

/**
 * Create TTN for Order
 */
export async function createOrderShipment(orderId, options = {}) {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!order) {
    throw new Error("Замовлення не знайдено");
  }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);

  // Check provider
  const isUp =
    order.delivery_provider_key === "up" ||
    (order.delivery_service && order.delivery_service.toLowerCase().includes("укр"));

  if (isUp) {
    throw new Error("Автоматичне створення ТТН для Укрпошти наразі налаштовується.");
  }

  // Find account
  let account = null;
  if (options.accountId) {
    account = db.prepare("SELECT * FROM delivery_accounts WHERE id = ?").get(options.accountId);
  } else {
    account = db
      .prepare(`
        SELECT * FROM delivery_accounts
        WHERE provider = 'np' AND is_active = 1
        ORDER BY is_default DESC, created_at ASC LIMIT 1
      `)
      .get();
  }

  const apiKey = account?.api_key || getActiveApiKey("np");
  if (!apiKey) {
    throw new Error("API ключ Нової пошти не налаштований. Додайте ключ у налаштуваннях.");
  }

  // Calculate total weight
  let totalWeight = Number(options.weight) || 1;
  if (!options.weight && items.length > 0) {
    let estimatedWeight = 0;
    for (const item of items) {
      const wStr = String(item.weight || "").toLowerCase();
      if (wStr.includes("кг")) {
        estimatedWeight += (parseFloat(wStr) || 1) * item.qty;
      } else if (wStr.includes("г")) {
        estimatedWeight += ((parseFloat(wStr) || 250) / 1000) * item.qty;
      } else {
        estimatedWeight += 0.5 * item.qty;
      }
    }
    totalWeight = Math.max(Math.round(estimatedWeight * 10) / 10, 0.5);
  }

  const sender = {
    cityRef: account?.city_ref || options.senderCityRef,
    warehouseRef: account?.warehouse_ref || options.senderWarehouseRef,
    senderRef: account?.sender_ref || options.senderRef,
    contactPersonRef: options.contactPersonRef,
    phone: account?.phone || options.senderPhone,
  };

  const recipient = {
    cityRef: order.delivery_city_id,
    city: order.delivery_city_name,
    branchRef: order.delivery_branch_id,
    branch: order.delivery_branch_name,
    firstName: order.customer_first_name,
    lastName: order.customer_last_name,
    phone: order.customer_phone,
  };

  const result = await novaPoshtaProvider.createShipment({
    apiKey,
    sender,
    recipient,
    order: {
      ...order,
      orderCode: order.order_code || `PAS-${order.number}`,
    },
    weight: totalWeight,
    seatsAmount: options.seatsAmount || 1,
    cost: options.cost || order.total,
    description: options.description || `Мед та продукти бджільництва (замовлення ${order.order_code || `#${order.number}`})`,
  });

  if (result.ok && result.trackingNumber) {
    const now = Date.now();
    const shipmentId = "sh_" + Date.now().toString(36) + "_" + crypto.randomBytes(3).toString("hex");

    db.transaction(() => {
      // 1. Insert into shipments table
      db.prepare(`
        INSERT INTO shipments (
          id, order_id, provider, account_id, tracking_number,
          document_ref, status, status_code, status_description,
          sender_data, recipient_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        shipmentId,
        order.id,
        "np",
        account?.id || null,
        result.trackingNumber,
        result.ref || null,
        "CREATED",
        "1",
        "Накладна зареєстрована в системі",
        JSON.stringify(sender),
        JSON.stringify(recipient),
        now,
        now
      );

      // 2. Update order
      db.prepare(`
        UPDATE orders
        SET tracking_number = ?,
            delivery_service = 'Нова Пошта',
            status = CASE WHEN status IN ('NEW', 'PROCESSING', 'AWAITING_PAYMENT', 'PAID', 'PACKED') THEN 'SHIPMENT_CREATED' ELSE status END,
            shipped_at = COALESCE(shipped_at, ?),
            updated_at = ?
        WHERE id = ?
      `).run(result.trackingNumber, now, now, order.id);

      // 3. Status history
      const hid = "osh_" + crypto.randomBytes(8).toString("hex");
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        hid,
        order.id,
        order.status,
        "SHIPMENT_CREATED",
        `Створено ТТН Нової пошти: ${result.trackingNumber}`,
        "admin",
        now
      );
    })();

    return {
      ok: true,
      trackingNumber: result.trackingNumber,
      documentRef: result.ref,
      cost: result.cost,
      estimatedDeliveryDate: result.estimatedDeliveryDate,
    };
  }

  throw new Error("Не вдалося отримати номер ТТН від Нової пошти");
}

/**
 * Cancel TTN for an Order
 */
export async function cancelOrderShipment(orderId) {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!order) {
    throw new Error("Замовлення не знайдено");
  }

  const shipment = db
    .prepare("SELECT * FROM shipments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(orderId);

  const apiKey = getActiveApiKey("np");
  if (shipment?.document_ref && apiKey) {
    try {
      await novaPoshtaProvider.cancelShipment(shipment.document_ref, apiKey);
    } catch (err) {
      // Continue to update local record even if remote API returned error
      console.warn("Nova Poshta cancel remote shipment warning:", err.message);
    }
  }

  const now = Date.now();
  const oldTracking = order.tracking_number;

  db.transaction(() => {
    if (shipment) {
      db.prepare("UPDATE shipments SET status = 'CANCELLED', updated_at = ? WHERE id = ?").run(now, shipment.id);
    }
    db.prepare("UPDATE orders SET tracking_number = NULL, updated_at = ? WHERE id = ?").run(now, order.id);

    const hid = "osh_" + crypto.randomBytes(8).toString("hex");
    db.prepare(`
      INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
      VALUES (?, ?, ?, ?, ?, 'admin', ?)
    `).run(
      hid,
      order.id,
      order.status,
      order.status,
      `Скасовано ТТН: ${oldTracking || ""}`.trim(),
      now
    );
  })();

  return { ok: true, message: "ТТН скасовано" };
}

/**
 * Get tracking status for order's shipment
 */
export async function getShipmentTracking(orderId) {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!order) {
    throw new Error("Замовлення не знайдено");
  }
  if (!order.tracking_number) {
    throw new Error("У замовлення немає номера ТТН");
  }

  const apiKey = getActiveApiKey("np");
  return await novaPoshtaProvider.getTracking(order.tracking_number, apiKey, order.customer_phone);
}

