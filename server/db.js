import Database from "better-sqlite3";
import crypto from "node:crypto";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES as OFFICIAL_CATEGORIES, PRODUCTS as OFFICIAL_PRODUCTS, DEFAULT_INTERNATIONAL_SETTINGS } from "./catalog-data.js";

// Load environment variables early if not already loaded
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getDatabasePath() {
  const isTest = process.env.NODE_ENV === "test";
  if (isTest) {
    if (process.env.DB_PATH && !process.env.DB_PATH.endsWith("galinka.db")) {
      return process.env.DB_PATH;
    }
    return path.resolve(__dirname, "../test-galinka.db");
  }
  return process.env.DB_PATH || path.resolve(__dirname, "../galinka.db");
}

export const DB_PATH = getDatabasePath();

// Ensure persistent directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency and performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      weight TEXT,
      price REAL NOT NULL,
      old_price REAL,
      stock INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      gift_box INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (category) REFERENCES categories(slug) ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      number INTEGER UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      customer_first_name TEXT NOT NULL,
      customer_last_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      total REAL NOT NULL,
      delivery_provider TEXT NOT NULL,
      delivery_provider_key TEXT NOT NULL,
      delivery_city_id TEXT,
      delivery_city_name TEXT NOT NULL,
      delivery_branch_id TEXT,
      delivery_branch_name TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      comment TEXT,
      receipt_url TEXT,
      receipt_name TEXT,
      idempotency_key TEXT UNIQUE,
      customer_token TEXT,
      delivery_region TEXT,
      delivery_warehouse_address TEXT,
      delivery_warehouse_ref TEXT,
      delivery_branch_number TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_receipts (
      id TEXT PRIMARY KEY,
      checkout_token TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      claimed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      weight TEXT,
      price REAL NOT NULL,
      qty INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS telegram_logs (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      recipient_id TEXT,
      chat_id TEXT,
      text TEXT NOT NULL,
      status TEXT NOT NULL,
      response_data TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_recipients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'manager',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_interactions (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      action TEXT NOT NULL,
      payload TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      total_orders INTEGER NOT NULL DEFAULT 0,
      total_spent REAL NOT NULL DEFAULT 0,
      first_order_at INTEGER NOT NULL,
      last_order_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      comment TEXT,
      changed_by TEXT NOT NULL DEFAULT 'system',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_pending_receipts_token ON pending_receipts(checkout_token);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_telegram_logs_created_at ON telegram_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_telegram_recipients_active ON telegram_recipients(is_active);
    CREATE INDEX IF NOT EXISTS idx_telegram_interactions_chat ON telegram_interactions(chat_id);
    CREATE INDEX IF NOT EXISTS idx_telegram_interactions_created_at ON telegram_interactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

    -- Production Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Stock Reservations Table
    CREATE TABLE IF NOT EXISTS stock_reservations (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Payments Table
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      receipt_url TEXT,
      receipt_name TEXT,
      confirmed_by TEXT,
      confirmed_at INTEGER,
      comment TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- Multi-account Delivery Accounts Table
    CREATE TABLE IF NOT EXISTS delivery_accounts (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL,
      sender_ref TEXT,
      sender_name TEXT,
      phone TEXT,
      city_ref TEXT,
      city_name TEXT,
      warehouse_ref TEXT,
      warehouse_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Shipments & TTN Tracking Table
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      account_id TEXT,
      tracking_number TEXT NOT NULL,
      document_ref TEXT,
      status TEXT NOT NULL DEFAULT 'CREATED',
      status_code TEXT,
      status_description TEXT,
      sender_data TEXT,
      recipient_data TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- Dedicated Settings Tables
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stock_reservations_order ON stock_reservations(order_id);
    CREATE INDEX IF NOT EXISTS idx_stock_reservations_product ON stock_reservations(product_id);
    CREATE INDEX IF NOT EXISTS idx_stock_reservations_status ON stock_reservations(status);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_delivery_accounts_provider ON delivery_accounts(provider);
    CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
    CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
  `);

  try {
    db.exec("ALTER TABLE orders ADD COLUMN order_code TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN customer_token TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN customer_id TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN tracking_number TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN delivery_service TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN shipped_at INTEGER");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN completed_at INTEGER");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN deleted_at INTEGER");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN delivery_region TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN delivery_warehouse_address TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN delivery_warehouse_ref TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN delivery_branch_number TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN preferred_contact TEXT DEFAULT 'viber'");
  } catch {}

  try {
    db.exec("ALTER TABLE products ADD COLUMN reserved_stock INTEGER NOT NULL DEFAULT 0");
  } catch {}

  try {
    db.exec("ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  } catch {}

  try {
    db.exec("ALTER TABLE products ADD COLUMN features TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE products ADD COLUMN box_items TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN is_international INTEGER DEFAULT 0");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN delivery_country TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE orders ADD COLUMN postal_code TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'ADMIN'");
  } catch {}

  try {
    db.exec("ALTER TABLE telegram_logs ADD COLUMN recipient_id TEXT");
  } catch {}

  try {
    db.exec("ALTER TABLE telegram_logs ADD COLUMN chat_id TEXT");
  } catch {}

  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code)");
  } catch {}

  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_customer_token ON orders(customer_token)");
  } catch {}

  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)");
  } catch {}

  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at)");
  } catch {}

  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number)");
  } catch {}

  migrateDataPersistence();
  seedInitialData();
}

// Canonical Ukrainian phone normalizer
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

function migrateDataPersistence() {
  // 1. Backfill delivery_service from delivery_provider if null
  try {
    db.prepare("UPDATE orders SET delivery_service = delivery_provider WHERE delivery_service IS NULL").run();
  } catch {}

  // 2. Backfill customers from existing orders
  try {
    const unlinkedOrders = db.prepare("SELECT * FROM orders WHERE customer_id IS NULL").all();
    if (unlinkedOrders.length > 0) {
      for (const order of unlinkedOrders) {
        const normPhone = normalizePhone(order.customer_phone);
        if (!normPhone) continue;

        let customer = db.prepare("SELECT * FROM customers WHERE phone = ?").get(normPhone);
        if (!customer) {
          const customerId = "c_" + crypto.randomBytes(8).toString("hex");
          const stats = db.prepare(`
            SELECT 
              COUNT(*) AS count, 
              COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total ELSE 0 END), 0) AS spent,
              MIN(created_at) AS first_date,
              MAX(created_at) AS last_date
            FROM orders
            WHERE customer_phone = ? OR customer_phone = ?
          `).get(order.customer_phone, normPhone);

          db.prepare(`
            INSERT INTO customers (
              id, phone, first_name, last_name, email,
              total_orders, total_spent, first_order_at, last_order_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            customerId,
            normPhone,
            order.customer_first_name || "Клієнт",
            order.customer_last_name || "",
            order.customer_email || null,
            stats.count || 1,
            stats.spent || 0,
            stats.first_date || order.created_at,
            stats.last_date || order.created_at,
            order.created_at,
            order.updated_at || order.created_at
          );
          customer = { id: customerId };
        }

        db.prepare("UPDATE orders SET customer_id = ? WHERE id = ?").run(customer.id, order.id);
      }
    }
  } catch (err) {
    console.warn("[Customers backfill warning]:", err.message);
  }

  // 3. Backfill order_status_history for any existing orders without history
  try {
    const ordersWithoutHistory = db.prepare(`
      SELECT o.id, o.status, o.created_at
      FROM orders o
      LEFT JOIN order_status_history h ON o.id = h.order_id
      WHERE h.id IS NULL
    `).all();

    if (ordersWithoutHistory.length > 0) {
      const insertHistory = db.prepare(`
        INSERT INTO order_status_history (id, order_id, from_status, to_status, comment, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const tx = db.transaction(() => {
        for (const o of ordersWithoutHistory) {
          const hid = "osh_" + crypto.randomBytes(8).toString("hex");
          insertHistory.run(
            hid,
            o.id,
            null,
            o.status || "NEW",
            "Початковий запис історії замовлення",
            "system",
            o.created_at
          );
        }
      });
      tx();
    }
  } catch (err) {
    console.warn("[Status history backfill warning]:", err.message);
  }

  // 4. Backfill order_code with GAL- prefix if null
  try {
    db.prepare(`
      UPDATE orders
      SET order_code = 'GAL-' || number
      WHERE order_code IS NULL
    `).run();
  } catch (err) {
    console.warn("[Order code backfill warning]:", err.message);
  }

  // 5. Backfill users table from customers if empty
  try {
    const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
    if (userCount === 0) {
      const allCustomers = db.prepare("SELECT * FROM customers").all();
      if (allCustomers.length > 0) {
        const insertUser = db.prepare(`
          INSERT OR IGNORE INTO users (id, phone, first_name, last_name, email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const tx = db.transaction(() => {
          for (const c of allCustomers) {
            insertUser.run(
              "u_" + c.id,
              c.phone,
              c.first_name,
              c.last_name,
              c.email || null,
              c.created_at,
              c.updated_at
            );
          }
        });
        tx();
      }
    }
  } catch (err) {
    console.warn("[Users backfill warning]:", err.message);
  }

  // 6. Backfill admin_users role (OWNER for primary admin)
  try {
    db.prepare(`
      UPDATE admin_users
      SET role = 'OWNER'
      WHERE id = 'admin_1' OR username = 'admin'
    `).run();
  } catch {}

  // 7. Seed default delivery accounts if table is empty
  try {
    const daCount = db.prepare("SELECT COUNT(*) AS count FROM delivery_accounts").get().count;
    if (daCount === 0) {
      const now = Date.now();
      const npKey = (process.env.NOVA_POSHTA_API_KEY || "").trim();
      const upKey = (process.env.UKRPOSHTA_API_KEY || "").trim();

      db.prepare(`
        INSERT INTO delivery_accounts (
          id, provider, name, api_key, sender_ref, sender_name,
          phone, city_ref, city_name, warehouse_ref, warehouse_name,
          is_active, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "da_np_main",
        "np",
        "Нова Пошта — Основний",
        npKey,
        null,
        "М'ясний рай у Галинки",
        "+380680257877",
        null,
        "Україна",
        null,
        "Відділення №1",
        1,
        1,
        now,
        now
      );

      db.prepare(`
        INSERT INTO delivery_accounts (
          id, provider, name, api_key, sender_ref, sender_name,
          phone, city_ref, city_name, warehouse_ref, warehouse_name,
          is_active, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "da_up_main",
        "up",
        "Укрпошта — Основний",
        upKey,
        null,
        "М'ясний рай у Галинки",
        "+380680257877",
        null,
        "Україна",
        null,
        "Відділення №1",
        0,
        0,
        now,
        now
      );
    }
  } catch (err) {
    console.warn("[Delivery accounts seed warning]:", err.message);
  }

  // 8. Backfill stock_reservations for active orders if none exist
  try {
    const resCount = db.prepare("SELECT COUNT(*) AS count FROM stock_reservations").get().count;
    if (resCount === 0) {
      const activeOrders = db.prepare(`
        SELECT id, created_at
        FROM orders
        WHERE status IN ('NEW', 'PROCESSING', 'AWAITING_PAYMENT')
          AND deleted_at IS NULL
      `).all();

      if (activeOrders.length > 0) {
        const insertRes = db.prepare(`
          INSERT INTO stock_reservations (id, order_id, product_id, qty, status, created_at, expires_at)
          VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
        `);
        const updateProductReserved = db.prepare(`
          UPDATE products SET reserved_stock = reserved_stock + ? WHERE id = ?
        `);

        const tx = db.transaction(() => {
          for (const ord of activeOrders) {
            const items = db.prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?").all(ord.id);
            for (const it of items) {
              const resId = "sr_" + crypto.randomBytes(8).toString("hex");
              insertRes.run(resId, ord.id, it.product_id, it.qty, ord.created_at, ord.created_at + 48 * 3600 * 1000);
              updateProductReserved.run(it.qty, it.product_id);
            }
          }
        });
        tx();
      }
    }
  } catch (err) {
    console.warn("[Stock reservations backfill warning]:", err.message);
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function seedInitialData() {
  const now = Date.now();

  // 1. Sync Categories & migrate legacy slugs
  try {
    const upsertCat = db.prepare(`
      INSERT INTO categories (slug, name, icon, sort_order)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        icon = excluded.icon,
        sort_order = excluded.sort_order
    `);

    // A. Insert official categories first so new FK references are valid
    const catTx = db.transaction(() => {
      for (const c of OFFICIAL_CATEGORIES) {
        upsertCat.run(c.slug, c.name, c.icon, c.sort_order);
      }
    });
    catTx();

    // B. Migrate old category slugs in existing products
    const legacyCategoryMap = {
      kurochka: "kuryache-kopchene",
      kopchenosti: "kopchene-myaso",
      sardelky: "sardelky-ta-kovbasky",
      pashtety: "pashtetky",
      salo: "domashnye",
    };
    for (const [oldSlug, newSlug] of Object.entries(legacyCategoryMap)) {
      db.prepare("UPDATE products SET category = ? WHERE category = ?").run(newSlug, oldSlug);
    }

    // C. Prune obsolete legacy categories
    db.prepare(`DELETE FROM categories WHERE slug NOT IN (${OFFICIAL_CATEGORIES.map((c) => `'${c.slug}'`).join(",")})`).run();
  } catch (err) {
    console.warn("[Categories sync warning]:", err.message);
  }

  // 2. Sync Products
  try {
    const upsertProd = db.prepare(`
      INSERT INTO products (
        id, slug, name, category, weight, price, old_price, stock, reserved_stock,
        is_active, featured, gift_box, description, image, box_items, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        weight = excluded.weight,
        price = excluded.price,
        old_price = excluded.old_price,
        stock = CASE WHEN products.stock <= 0 THEN excluded.stock ELSE products.stock END,
        featured = excluded.featured,
        gift_box = excluded.gift_box,
        description = excluded.description,
        box_items = excluded.box_items,
        updated_at = excluded.updated_at
    `);

    const prodTx = db.transaction(() => {
      for (const p of OFFICIAL_PRODUCTS) {
        const boxItemsStr = p.boxItems ? (typeof p.boxItems === "string" ? p.boxItems : JSON.stringify(p.boxItems)) : null;
        upsertProd.run(
          p.id,
          p.slug,
          p.name,
          p.category,
          p.weight || "1 кг",
          p.price,
          p.oldPrice || null,
          p.stock !== undefined ? p.stock : 35,
          p.featured ? 1 : 0,
          p.giftBox ? 1 : 0,
          p.description || "",
          p.image || "kovbasa-domashnya",
          boxItemsStr,
          now,
          now
        );
      }
    });
    prodTx();

    // Clean up obsolete legacy products (like p1..p10 from previous initial mocks)
    const officialIds = new Set(OFFICIAL_PRODUCTS.map((p) => p.id));
    const officialSlugs = new Set(OFFICIAL_PRODUCTS.map((p) => p.slug));
    const allExisting = db.prepare("SELECT id, slug FROM products").all();
    for (const ex of allExisting) {
      if (!officialIds.has(ex.id) && !officialSlugs.has(ex.slug)) {
        const hasOrder = db.prepare("SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1").get(ex.id);
        if (hasOrder) {
          db.prepare("UPDATE products SET is_active = 0 WHERE id = ?").run(ex.id);
        } else {
          db.prepare("DELETE FROM products WHERE id = ?").run(ex.id);
        }
      }
    }
  } catch (err) {
    console.warn("[Products sync warning]:", err.message);
  }

  // 3. Seed / Update settings with international delivery
  const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  if (!settingsRow) {
    const defaultSettings = {
      store: {
        name: "М'ясний рай у Галинки",
        tagline: "Домашні ковбаси та копченості",
        phone: "+380 68 025 78 77",
        viber: "+380680257877",
        tiktok: "@kopchonosti777",
        telegram: "",
        instagram: "",
        facebook: "",
        youtube: "",
        workingHours: "Пн-Сб 09:00 - 19:00, Нд 10:00 - 16:00",
        description: "Справжні домашні ковбаси, копченості, курочка, сало та паштети від Галинки. Натуральне копчення на дровах, перевірені домашні рецепти та швидка доставка Новою Поштою по всій Україні та за кордон.",
      },
      contacts: {
        phone: "+380 68 025 78 77",
        viber: "+380680257877",
        tiktok: "@kopchonosti777",
        telegram: "",
        instagram: "",
        facebook: "",
        youtube: "",
        email: "",
        pickupAddress: "",
      },
      about: {
        title: "Домашні копченості з душею від Галинки",
        shortText: "Мене звати Галина, і я готую для вас справжні домашні ковбаси та копченості. Тільки свіже добірне м'ясо, натуральні спеції та традиційне копчення на дровах.",
        fullDescription: "Кожен шматочок маринується за перевіреними родинними рецептами без штучних барвників та консервантів. Наше копчення — виключно на дровах вільхи та фруктових дерев, що дає неповторний аромат та золотисту скоринку. Дякуємо нашій великій аудиторії в TikTok (понад 110 тисяч підписників) за довіру!",
        followersCount: "110K+",
        likesCount: "700K+",
        foundationYear: "2020",
        location: "Україна",
      },
      payment: {
        bank: "monobank",
        card: "4441 1111 2222 3333",
        holder: "Галина",
        purpose: "Оплата замовлення",
        instruction: "Після оформлення замовлення на сайті Галинка зв'яжеться з вами у Viber або за телефоном для узгодження деталей.",
      },
      delivery: {
        novaPoshtaEnabled: true,
        ukrposhtaEnabled: false,
        international: DEFAULT_INTERNATIONAL_SETTINGS,
      },
    };
    db.prepare("INSERT INTO settings (key, value) VALUES ('app_settings', ?)").run(
      JSON.stringify(defaultSettings)
    );
  } else {
    try {
      const parsed = JSON.parse(settingsRow.value);
      let changed = false;
      if (parsed.payment && !parsed.payment.purpose) {
        parsed.payment.purpose = "Оплата замовлення";
        changed = true;
      }
      if (!parsed.delivery) {
        parsed.delivery = {
          novaPoshtaEnabled: true,
          ukrposhtaEnabled: false,
          international: DEFAULT_INTERNATIONAL_SETTINGS,
        };
        changed = true;
      } else if (!parsed.delivery.international) {
        parsed.delivery.international = DEFAULT_INTERNATIONAL_SETTINGS;
        changed = true;
      }
      if (changed) {
        db.prepare("UPDATE settings SET value = ? WHERE key = 'app_settings'").run(JSON.stringify(parsed));
      }
    } catch {}
  }

  // 4. Seed admin user
  const adminCount = db.prepare("SELECT COUNT(*) AS count FROM admin_users").get().count;
  if (adminCount === 0) {
    const username = process.env.ADMIN_LOGIN || "admin";
    let plainPassword = process.env.ADMIN_PASSWORD;
    if (!plainPassword) {
      if (process.env.NODE_ENV === "production") {
        plainPassword = crypto.randomBytes(16).toString("hex");
        console.warn(`[SECURITY WARNING] No ADMIN_PASSWORD provided in production! Generated temporary admin password: ${plainPassword}`);
      } else {
        plainPassword = "admin_dev_password_change_in_prod";
      }
    }
    const { hash, salt } = hashPassword(plainPassword);
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, salt, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run("admin_1", username, hash, salt, Date.now());
  }

  // 5. Migrate or seed telegram chatId into telegram_recipients if recipients table is empty
  const recipientCount = db.prepare("SELECT COUNT(*) AS count FROM telegram_recipients").get().count;
  if (recipientCount === 0) {
    const existingChatId = (process.env.TELEGRAM_CHAT_ID || "").trim();
    if (existingChatId) {
      db.prepare(`
        INSERT INTO telegram_recipients (id, name, username, chat_id, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "tr_default_admin",
        "Адміністратор Галинка",
        "@kopchonosti777",
        existingChatId,
        "owner",
        1,
        Date.now(),
        Date.now()
      );
    }
  }
}
