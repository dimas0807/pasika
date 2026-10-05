import { db } from "./db.js";

const DEFAULT_STORE = {
  name: "М'ясний рай у Галинки",
  tagline: "Домашні ковбаси та копченості",
  phone: "+380 68 025 78 77",
  viber: "+380680257877",
  tiktok: "@kopchonosti777",
  telegram: "",
  instagram: "",
  facebook: "",
  youtube: "",
  email: "",
  address: "Україна",
  workingHours: "Пн-Сб 09:00 - 19:00, Нд 10:00 - 16:00",
  description: "Справжні домашні ковбаси, копченості, курочка, сало та паштети від Галинки. Натуральне копчення на дровах, перевірені домашні рецепти та доставка Новою Поштою по всій Україні.",
  logoText: "М'ЯСНИЙ РАЙ У ГАЛИНКИ",
  heroTitle: "М'ЯСНИЙ РАЙ У ГАЛИНКИ",
  heroSubtitle: "Домашні ковбаси та копченості",
};

const DEFAULT_ABOUT = {
  title: "Домашні копченості з душею від Галинки",
  shortText: "Мене звати Галина, і я готую для вас справжні домашні ковбаси та копченості. Тільки свіже добірне м'ясо, натуральні спеції та традиційне копчення на дровах.",
  fullDescription: "Кожен шматочок м'яса маринується за перевіреними родинними рецептами без штучних барвників та консервантів. Наше копчення — виключно на дровах вільхи та фруктових дерев, що дає неповторний аромат та золотисту скоринку. Дякуємо нашій великій аудиторії в TikTok (понад 110 тисяч підписників) за довіру!",
  followersCount: "110K+",
  likesCount: "700K+",
  location: "Україна",
  image: "/images/about-galinka.jpg",
};

const DEFAULT_CONTACTS = {
  phone: "+380 68 025 78 77",
  viber: "+380680257877",
  tiktok: "@kopchonosti777",
  telegram: "",
  instagram: "",
  facebook: "",
  youtube: "",
  email: "",
  pickupAddress: "",
  pickupLat: "",
  pickupLng: "",
};

function normalizeAbout(about = {}) {
  const merged = { ...DEFAULT_ABOUT, ...about };
  const short = merged.shortText || merged.lead || DEFAULT_ABOUT.shortText;
  const full = merged.fullDescription || merged.story || DEFAULT_ABOUT.fullDescription;
  const hives = merged.hivesCount || merged.stats?.hives || DEFAULT_ABOUT.hivesCount;
  const years = merged.foundationYear || merged.stats?.years || DEFAULT_ABOUT.foundationYear;
  const loc = merged.location || DEFAULT_ABOUT.location;

  merged.shortText = short;
  merged.lead = short;
  merged.fullDescription = full;
  merged.story = full;
  merged.hivesCount = hives;
  merged.foundationYear = years;
  merged.location = loc;
  merged.stats = {
    ...(merged.stats || {}),
    hives,
    years,
  };
  return merged;
}

export function getPublicSettings(req, res) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  let settings = {};
  if (row) {
    try {
      settings = JSON.parse(row.value);
    } catch {}
  }

  settings.store = { ...DEFAULT_STORE, ...(settings.store || {}) };
  settings.contacts = { ...DEFAULT_CONTACTS, ...(settings.contacts || {}) };
  settings.about = normalizeAbout(settings.about);

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
  settings.contacts = { ...DEFAULT_CONTACTS, ...(settings.contacts || {}) };
  settings.about = normalizeAbout(settings.about);

  const botToken = settings.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = settings.telegram?.chatId || process.env.TELEGRAM_CHAT_ID || "";

  settings.telegram = {
    enabled: settings.telegram?.enabled ?? true,
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
    if (body.telegram.enabled !== undefined) {
      finalTelegram.enabled = Boolean(body.telegram.enabled);
    }
  }

  const mergedStore = {
    ...DEFAULT_STORE,
    ...(currentObj.store || {}),
    ...(body.store || {}),
  };

  const mergedContacts = {
    ...DEFAULT_CONTACTS,
    ...(currentObj.contacts || {}),
    ...(body.contacts || {}),
  };

  const mergedAbout = normalizeAbout({
    ...(currentObj.about || {}),
    ...(body.about || {}),
  });

  const merged = {
    ...currentObj,
    ...body,
    store: mergedStore,
    about: mergedAbout,
    contacts: mergedContacts,
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
      enabled: finalTelegram.enabled ?? true,
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
