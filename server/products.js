import crypto from "node:crypto";
import { db } from "./db.js";

function mapProductRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    weight: row.weight,
    price: row.price,
    oldPrice: row.old_price,
    stock: row.stock,
    featured: Boolean(row.featured),
    giftBox: Boolean(row.gift_box),
    description: row.description,
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------- Public Endpoints ----------------

export function getAllProducts(req, res) {
  const { category, featured } = req.query;
  let sql = "SELECT * FROM products";
  const params = [];

  const conditions = [];
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (featured !== undefined) {
    conditions.push("featured = ?");
    params.push(featured === "true" || featured === "1" ? 1 : 0);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY featured DESC, created_at ASC";

  const rows = db.prepare(sql).all(...params);
  return res.json(rows.map(mapProductRow));
}

export function getProductBySlug(req, res) {
  const { slug } = req.params;
  const row = db.prepare("SELECT * FROM products WHERE slug = ?").get(slug);
  if (!row) {
    return res.status(404).json({ error: "Товар не знайдено" });
  }
  return res.json(mapProductRow(row));
}

export function getProductById(req, res) {
  const { id } = req.params;
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!row) {
    return res.status(404).json({ error: "Товар не знайдено" });
  }
  return res.json(mapProductRow(row));
}

export function getCategories(req, res) {
  const rows = db.prepare("SELECT slug, name, icon FROM categories ORDER BY sort_order ASC").all();
  return res.json(rows);
}

// ---------------- Admin Endpoints ----------------

const UKR_TO_LAT = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh",
  з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya",
  "’": "", "'": "", "`": "", "ʼ": "",
};

function transliterateUa(text = "") {
  return String(text)
    .toLowerCase()
    .split("")
    .map((char) => (UKR_TO_LAT[char] !== undefined ? UKR_TO_LAT[char] : char))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveUniqueSlug(baseSlug, productId = null) {
  let slug = baseSlug || "product";
  let count = 2;
  while (true) {
    const existing = db.prepare("SELECT id FROM products WHERE slug = ?").get(slug);
    if (!existing || (productId && existing.id === productId)) {
      return slug;
    }
    slug = `${baseSlug}-${count}`;
    count++;
  }
}

export function saveProduct(req, res) {
  const body = req.body || {};
  const id = body.id || "p" + Date.now();
  const name = (body.name || "").trim();
  if (!name) {
    return res.status(400).json({ error: "Назва товару обов'язкова" });
  }

  const existing = db.prepare("SELECT id, image FROM products WHERE id = ?").get(id);

  // Mandatory photo validation for NEW products:
  let image = (body.image || "").trim();
  if (!existing) {
    if (!image) {
      return res.status(400).json({ error: "Фото товару обов'язкове для створення нового товару" });
    }
  } else {
    if (!image) {
      image = existing.image || "";
    }
  }

  const rawSlug = (body.slug || "").trim() || transliterateUa(name);
  const cleanSlug = transliterateUa(rawSlug);
  const slug = resolveUniqueSlug(cleanSlug, existing ? id : null);

  const category = body.category || "honey";
  const weight = body.weight || "";
  const price = Number(body.price) || 0;
  const oldPrice = body.oldPrice ? Number(body.oldPrice) : null;
  const stock = Number.isInteger(Number(body.stock)) ? Number(body.stock) : 0;
  const featured = body.featured ? 1 : 0;
  const giftBox = category === "gift-boxes" || body.giftBox ? 1 : 0;
  const description = body.description || "";
  const now = Date.now();

  if (existing) {
    db.prepare(`
      UPDATE products SET
        slug = ?, name = ?, category = ?, weight = ?, price = ?,
        old_price = ?, stock = ?, featured = ?, gift_box = ?,
        description = ?, image = ?, updated_at = ?
      WHERE id = ?
    `).run(
      slug, name, category, weight, price, oldPrice, stock,
      featured, giftBox, description, image, now, id
    );
  } else {
    db.prepare(`
      INSERT INTO products (
        id, slug, name, category, weight, price, old_price, stock,
        featured, gift_box, description, image, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, slug, name, category, weight, price, oldPrice, stock,
      featured, giftBox, description, image, now, now
    );
  }

  const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  return res.json(mapProductRow(updated));
}

export function deleteProduct(req, res) {
  const { id } = req.params;
  const resDel = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  if (resDel.changes === 0) {
    return res.status(404).json({ error: "Товар не знайдено" });
  }
  return res.json({ success: true });
}

export function duplicateProduct(req, res) {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ error: "Товар не знайдено" });
  }

  const newId = "p" + Date.now() + "_" + crypto.randomBytes(2).toString("hex");
  const newName = `${existing.name} (копія)`;
  const baseSlug = `${existing.slug}-2`;
  const newSlug = resolveUniqueSlug(baseSlug);
  const now = Date.now();

  db.prepare(`
    INSERT INTO products (
      id, slug, name, category, weight, price, old_price, stock,
      featured, gift_box, description, image, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId, newSlug, newName, existing.category, existing.weight,
    existing.price, existing.old_price, existing.stock, existing.featured,
    existing.gift_box, existing.description, existing.image, now, now
  );

  const copied = db.prepare("SELECT * FROM products WHERE id = ?").get(newId);
  return res.json(mapProductRow(copied));
}

export function saveCategory(req, res) {
  const body = req.body || {};
  const name = (body.name || "").trim();
  if (!name) {
    return res.status(400).json({ error: "Назва категорії обов'язкова" });
  }

  let slug = (body.slug || "").trim();
  if (!slug) {
    slug = transliterateUa(name);
  } else {
    slug = transliterateUa(slug);
  }

  const icon = (body.icon || "🍯").trim();
  const sortOrder = Number.isInteger(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

  const existing = db.prepare("SELECT slug FROM categories WHERE slug = ?").get(slug);
  if (existing) {
    db.prepare("UPDATE categories SET name = ?, icon = ?, sort_order = ? WHERE slug = ?").run(
      name, icon, sortOrder, slug
    );
  } else {
    db.prepare("INSERT INTO categories (slug, name, icon, sort_order) VALUES (?, ?, ?, ?)").run(
      slug, name, icon, sortOrder
    );
  }

  const updated = db.prepare("SELECT slug, name, icon, sort_order as sortOrder FROM categories WHERE slug = ?").get(slug);
  return res.json(updated);
}

export function deleteCategory(req, res) {
  const { slug } = req.params;
  const count = db.prepare("SELECT COUNT(*) as count FROM products WHERE category = ?").get(slug)?.count || 0;
  if (count > 0) {
    return res.status(400).json({
      error: `У цій категорії є ${count} товарів. Спочатку перенесіть товари в іншу категорію.`,
    });
  }

  const delRes = db.prepare("DELETE FROM categories WHERE slug = ?").run(slug);
  if (delRes.changes === 0) {
    return res.status(404).json({ error: "Категорію не знайдено" });
  }
  return res.json({ success: true });
}

export function getDashboardStats(req, res) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
  const ordersToday = db.prepare("SELECT COUNT(*) as count FROM orders WHERE created_at >= ?").get(startOfDay).count;
  const newOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'NEW'").get().count;
  const processingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'PROCESSING'").get().count;
  const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'COMPLETED'").get().count;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as rev FROM orders WHERE status != 'CANCELLED'").get().rev;

  // Recent 6 orders
  const recentOrders = db.prepare(`
    SELECT id, number, status, total, customer_first_name, customer_last_name, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 6
  `).all().map((o) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    total: o.total,
    customer: { firstName: o.customer_first_name, lastName: o.customer_last_name },
    createdAt: o.created_at,
  }));

  // Top products sold
  const topProducts = db.prepare(`
    SELECT name, SUM(qty) as qty
    FROM order_items
    JOIN orders ON order_items.order_id = orders.id
    WHERE orders.status != 'CANCELLED'
    GROUP BY name
    ORDER BY qty DESC
    LIMIT 5
  `).all();

  // Last 10 orders for sales chart
  const salesOrders = db.prepare(`
    SELECT id, number, total, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  // Telegram logs (last 5)
  const telegramLogs = db.prepare(`
    SELECT id, order_id, text, status, created_at
    FROM telegram_logs
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  return res.json({
    kpis: {
      totalOrders,
      ordersToday,
      newOrders,
      processingOrders,
      completedOrders,
      totalRevenue,
    },
    recentOrders,
    topProducts,
    salesOrders,
    telegramLogs,
  });
}
