import { db } from "./db.js";

const DEFAULT_STORE = {
  name: "Honey Pasika",
  phone: "+380 67 835 23 11",
  email: "hello@pasika-honey.ua",
  address: "Прикарпаття, с. Новоселиця, Снятинський район",
  workingHours: "Пн-Нд 09:00 - 20:00",
  instagram: "@honey_pasika",
  tiktok: "@honey.dsv",
  telegram: "@pasika_honey",
  description: "Натуральний мед та продукти бджільництва з родинної пасіки на Прикарпатті.",
};

const DEFAULT_ABOUT = {
  title: "Родинна пасіка в серці Прикарпаття",
  shortText: "Ми пасічники і дуже любимо родинну справу. Знаходимось на Прикарпатті, в селі Новоселиця Снятинського району.",
  fullDescription: "Перший наш вулик з'явився 10 років назад, а сьогодні на нашій пасіці налічується понад 100 вуликів. З того часу любов до бджільництва виросла у власне сімейне виробництво натурального меду найвищої якості.",
  foundationYear: "2014",
  hivesCount: "100+",
  location: "с. Новоселиця, Івано-Франківська обл.",
  image: "/images/about-apiary.jpg",
};

export function getPublicSettings(req, res) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  let settings = {};
  if (row) {
    try {
      settings = JSON.parse(row.value);
    } catch {}
  }

  settings.store = { ...DEFAULT_STORE, ...(settings.store || {}) };
  settings.about = { ...DEFAULT_ABOUT, ...(settings.about || {}) };

  delete settings.admin;
  if (settings.telegram) {
    delete settings.telegram.botToken;
  }
  if (settings.payment && !settings.payment.purpose) {
    settings.payment.purpose = "Оплата замовлення";
  }

  return res.json(settings);
}

export function getAdminSettings(req, res) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  let settings = {};
  if (row) {
    try {
      settings = JSON.parse(row.value);
    } catch {}
  }

  settings.store = { ...DEFAULT_STORE, ...(settings.store || {}) };
  settings.about = { ...DEFAULT_ABOUT, ...(settings.about || {}) };

  const botToken = settings.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = settings.telegram?.chatId || process.env.TELEGRAM_CHAT_ID || "";

  settings.telegram = {
    hasToken: Boolean(botToken),
    botToken: botToken ? "••••••••••••••••" : "",
    chatId: chatId || "",
  };

  delete settings.admin;
  return res.json(settings);
}

export function updateSettings(req, res) {
  const body = req.body || {};
  delete body.admin;

  const current = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  let currentObj = {};
  if (current) {
    try {
      currentObj = JSON.parse(current.value);
    } catch {}
  }

  let finalTelegram = { ...(currentObj.telegram || {}) };
  if (body.telegram) {
    const rawToken = (body.telegram.botToken || "").trim();
    if (rawToken && rawToken !== "••••••••••••••••") {
      finalTelegram.botToken = rawToken;
    }
    if (body.telegram.chatId !== undefined) {
      finalTelegram.chatId = String(body.telegram.chatId).trim();
    }
  }

  const merged = {
    ...currentObj,
    ...body,
    store: { ...DEFAULT_STORE, ...(currentObj.store || {}), ...(body.store || {}) },
    about: { ...DEFAULT_ABOUT, ...(currentObj.about || {}), ...(body.about || {}) },
    contacts: { ...(currentObj.contacts || {}), ...(body.contacts || {}) },
    payment: { ...(currentObj.payment || {}), ...(body.payment || {}) },
    delivery: { ...(currentObj.delivery || {}), ...(body.delivery || {}) },
    telegram: finalTelegram,
  };

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('app_settings', ?)").run(
    JSON.stringify(merged)
  );

  const responseSettings = {
    ...merged,
    telegram: {
      hasToken: Boolean(merged.telegram?.botToken),
      botToken: merged.telegram?.botToken ? "••••••••••••••••" : "",
      chatId: merged.telegram?.chatId || "",
    },
  };

  return res.json(responseSettings);
}

export function getTelegramLogs(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const rows = db.prepare(`
    SELECT id, order_id, text, status, response_data, created_at
    FROM telegram_logs
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);

  return res.json(rows);
}
