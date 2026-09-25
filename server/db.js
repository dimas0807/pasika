import Database from "better-sqlite3";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, "../pasika.db");

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
      text TEXT NOT NULL,
      status TEXT NOT NULL,
      response_data TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_pending_receipts_token ON pending_receipts(checkout_token);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_telegram_logs_created_at ON telegram_logs(created_at);
  `);

  try {
    db.exec("ALTER TABLE orders ADD COLUMN customer_token TEXT");
  } catch {}

  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_orders_customer_token ON orders(customer_token)");
  } catch {}

  seedInitialData();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function seedInitialData() {
  // 1. Seed categories
  const catCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get().count;
  if (catCount === 0) {
    const insertCat = db.prepare(
      "INSERT INTO categories (slug, name, icon, sort_order) VALUES (?, ?, ?, ?)"
    );
    const initialCategories = [
      { slug: "honey", name: "Мед", icon: "🍯", sort_order: 1 },
      { slug: "cream-honey", name: "Крем-мед", icon: "🧈", sort_order: 2 },
      { slug: "nuts-honey", name: "Горіхи в меді", icon: "🌰", sort_order: 3 },
      { slug: "pollen", name: "Пилок", icon: "🌼", sort_order: 4 },
      { slug: "propolis", name: "Прополіс", icon: "🟤", sort_order: 5 },
      { slug: "perga", name: "Перга", icon: "🟡", sort_order: 6 },
      { slug: "gift-boxes", name: "Подарункові бокси", icon: "🎁", sort_order: 7 },
    ];
    const tx = db.transaction(() => {
      for (const c of initialCategories) {
        insertCat.run(c.slug, c.name, c.icon, c.sort_order);
      }
    });
    tx();
  }

  // 2. Seed products
  const prodCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
  if (prodCount === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (
        id, slug, name, category, weight, price, old_price, stock,
        featured, gift_box, description, image, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialProducts = [
      {
        id: "p1", slug: "med-naturalnyi-500g", name: "Мед натуральний", category: "honey",
        weight: "500 г", price: 220, oldPrice: null, stock: 34, featured: 1, giftBox: 0,
        description: "Натуральний квітковий мед з власної пасіки. Зібраний та розфасований вручну, без додавання цукру та консервантів.",
        image: "honey-jar",
      },
      {
        id: "p2", slug: "med-naturalnyi-1kg", name: "Мед натуральний", category: "honey",
        weight: "1 кг", price: 380, oldPrice: 420, stock: 21, featured: 1, giftBox: 0,
        description: "Натуральний квітковий мед з власної пасіки у зручній літровій банці — для родини або в подарунок.",
        image: "honey-jar-big",
      },
      {
        id: "p3", slug: "krem-med-250g", name: "Крем-мед", category: "cream-honey",
        weight: "250 г", price: 190, oldPrice: null, stock: 18, featured: 1, giftBox: 0,
        description: "Ніжний крем-мед збитої текстури. Не кристалізується, легко намазується.",
        image: "cream-honey",
      },
      {
        id: "p4", slug: "horihy-v-medi-250g", name: "Горіхи в меді", category: "nuts-honey",
        weight: "250 г", price: 260, oldPrice: null, stock: 14, featured: 1, giftBox: 0,
        description: "Волоські горіхи, вимочені у натуральному меді. Смачний та корисний перекус.",
        image: "nuts-honey",
      },
      {
        id: "p5", slug: "kvitkovyi-pylok-100g", name: "Квітковий пилок", category: "pollen",
        weight: "100 г", price: 140, oldPrice: null, stock: 25, featured: 0, giftBox: 0,
        description: "Натуральні гранули квіткового пилку, зібрані бджолами на власній пасіці.",
        image: "pollen",
      },
      {
        id: "p6", slug: "propolis-20g", name: "Прополіс", category: "propolis",
        weight: "20 г", price: 120, oldPrice: null, stock: 30, featured: 0, giftBox: 0,
        description: "Натуральний бджолиний прополіс у шматочках.",
        image: "propolis",
      },
      {
        id: "p7", slug: "perga-100g", name: "Перга", category: "perga",
        weight: "100 г", price: 220, oldPrice: null, stock: 12, featured: 0, giftBox: 0,
        description: "Бджолина перга — натуральний продукт пасіки у гранулах.",
        image: "perga",
      },
      {
        id: "p8", slug: "box-medovyi", name: "Подарунковий бокс «Медовий»", category: "gift-boxes",
        weight: "набір", price: 450, oldPrice: null, stock: 10, featured: 1, giftBox: 1,
        description: "Крафтова коробка з медом, крем-медом та невеликим сюрпризом. Можливе персональне оформлення.",
        image: "box-medovyi",
      },
      {
        id: "p9", slug: "box-karpatskyi", name: "Подарунковий бокс «Карпатський»", category: "gift-boxes",
        weight: "набір", price: 590, oldPrice: null, stock: 8, featured: 1, giftBox: 1,
        description: "Розширений набір: мед, прополіс, пилок та горіхи в меді у крафтовій упаковці зі стрічкою.",
        image: "box-karpatskyi",
      },
      {
        id: "p10", slug: "box-osoblyvyi-den", name: "Подарунковий бокс «Особливий день»", category: "gift-boxes",
        weight: "набір", price: 790, oldPrice: null, stock: 6, featured: 1, giftBox: 1,
        description: "Преміальний бокс для весілля чи особливої події: мед, крем-мед, перга, квіти та індивідуальна етикетка.",
        image: "box-osoblyvyi",
      },
    ];

    const now = Date.now();
    const tx = db.transaction(() => {
      for (const p of initialProducts) {
        insertProd.run(
          p.id, p.slug, p.name, p.category, p.weight, p.price, p.oldPrice,
          p.stock, p.featured, p.giftBox, p.description, p.image, now, now
        );
      }
    });
    tx();
  }

  // 3. Seed settings
  const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  if (!settingsRow) {
    const defaultSettings = {
      contacts: {
        phone: "+380 67 835 23 11",
        email: "hello@pasika-honey.ua",
        tiktok: "@honey.dsv",
        telegram: "@pasika_honey",
      },
      payment: {
        bank: "monobank",
        card: "4441 1111 2222 3333",
        holder: "Олена Петріна",
        purpose: "Оплата замовлення",
        instruction: "Після оплати завантажте фото або файл чека — ми підтвердимо замовлення.",
      },
      delivery: {
        novaPoshtaEnabled: true,
        ukrposhtaEnabled: true,
      },
    };
    db.prepare("INSERT INTO settings (key, value) VALUES ('app_settings', ?)").run(
      JSON.stringify(defaultSettings)
    );
  } else {
    try {
      const parsed = JSON.parse(settingsRow.value);
      if (parsed.payment && !parsed.payment.purpose) {
        parsed.payment.purpose = "Оплата замовлення";
        db.prepare("UPDATE settings SET value = ? WHERE key = 'app_settings'").run(JSON.stringify(parsed));
      }
    } catch {}
  }

  // 4. Seed admin user
  const adminCount = db.prepare("SELECT COUNT(*) AS count FROM admin_users").get().count;
  if (adminCount === 0) {
    const username = process.env.ADMIN_LOGIN || "admin";
    const plainPassword = process.env.ADMIN_PASSWORD || "pasika2026";
    const { hash, salt } = hashPassword(plainPassword);
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, salt, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run("admin_1", username, hash, salt, Date.now());
  }
}
