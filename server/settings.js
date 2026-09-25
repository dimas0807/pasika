import { db } from "./db.js";

export function getPublicSettings(req, res) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  if (!row) {
    return res.status(404).json({ error: "Налаштування не знайдено" });
  }

  const settings = JSON.parse(row.value);
  // Ensure no sensitive or admin auth data is ever in public settings
  delete settings.admin;
  if (settings.payment && !settings.payment.purpose) {
    settings.payment.purpose = "Оплата замовлення";
  }

  return res.json(settings);
}

export function updateSettings(req, res) {
  const body = req.body || {};
  // Strip out any admin credentials if passed by mistake
  delete body.admin;

  const current = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
  const currentObj = current ? JSON.parse(current.value) : {};

  const merged = {
    ...currentObj,
    ...body,
    contacts: { ...(currentObj.contacts || {}), ...(body.contacts || {}) },
    payment: { ...(currentObj.payment || {}), ...(body.payment || {}) },
    delivery: { ...(currentObj.delivery || {}), ...(body.delivery || {}) },
  };

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('app_settings', ?)").run(
    JSON.stringify(merged)
  );

  return res.json(merged);
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
