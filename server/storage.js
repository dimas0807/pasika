import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { getSession } from "./auth.js";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const STORAGE_DIR = path.resolve(__dirname, "../storage/receipts");

// Ensure directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Allowed file types
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

// In-memory IP rate limiter for receipt uploads: max 10 uploads per IP per 5 minutes
const uploadAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 10;

export function checkUploadRateLimit(ip) {
  const now = Date.now();
  const history = (uploadAttempts.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (history.length >= MAX_UPLOADS_PER_WINDOW) {
    return false;
  }
  history.push(now);
  uploadAttempts.set(ip, history);
  return true;
}

// TTL for unclaimed receipts: 30 minutes
export const UNCLAIMED_RECEIPT_TTL_MS = 30 * 60 * 1000;

export function cleanExpiredUnclaimedReceipts() {
  try {
    const cutoff = Date.now() - UNCLAIMED_RECEIPT_TTL_MS;
    const expired = db
      .prepare("SELECT id, file_path FROM pending_receipts WHERE claimed = 0 AND created_at < ?")
      .all(cutoff);

    for (const row of expired) {
      try {
        if (fs.existsSync(row.file_path)) {
          fs.unlinkSync(row.file_path);
        }
      } catch (err) {
        console.warn("[Receipt Cleanup Warning]:", err.message);
      }
    }

    db.prepare("DELETE FROM pending_receipts WHERE claimed = 0 AND created_at < ?").run(cutoff);
  } catch (err) {
    console.error("[Receipt Cleanup Error]:", err.message);
  }
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    cb(null, `receipt_${uniqueSuffix}${ext}`);
  },
});

export const uploadReceiptMulter = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Непідтримуваний тип файлу. Дозволено: JPG, PNG, WEBP, PDF"));
    }
  },
});

// Product Images Storage
export const PRODUCTS_STORAGE_DIR = path.resolve(__dirname, "../storage/products");
if (!fs.existsSync(PRODUCTS_STORAGE_DIR)) {
  fs.mkdirSync(PRODUCTS_STORAGE_DIR, { recursive: true });
}

const ALLOWED_PRODUCT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const productStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PRODUCTS_STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    cb(null, `prod_${uniqueSuffix}${ext}`);
  },
});

export const uploadProductImageMulter = multer({
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_PRODUCT_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Непідтримуваний тип файлу. Дозволено лише JPG, PNG, WEBP"));
    }
  },
});

export function handleProductImageUpload(req, res) {
  const file = req.file || req.files?.file?.[0] || req.files?.image?.[0];
  if (!file) {
    return res.status(400).json({ error: "Файл зображення не надано" });
  }

  const fileUrl = `/uploads/products/${file.filename}`;
  return res.json({
    success: true,
    fileUrl,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  });
}

// Middleware for rate limiting and checkout token validation
export function uploadReceiptValidationMiddleware(req, res, next) {
  // 1. Rate Limit
  const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
  if (!checkUploadRateLimit(clientIp)) {
    return res.status(429).json({
      error: "Забагато спроб завантаження. Будь ласка, зачекайте 5 хвилин перед повторною спробою.",
    });
  }

  // Run cleanup of expired unclaimed files in background
  cleanExpiredUnclaimedReceipts();

  next();
}

export function handleReceiptUpload(req, res) {
  const checkoutToken = (req.body?.checkoutToken || req.headers["x-checkout-token"] || "").trim();

  if (!checkoutToken || checkoutToken.length < 10) {
    // If file was written by multer, remove it immediately
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }
    return res.status(400).json({
      error: "Завантаження чека можливе лише під час активного оформлення замовлення (checkoutToken обов'язковий)",
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Файл чека не надано" });
  }

  // Check how many unclaimed receipts are currently associated with this checkoutToken (prevent flooding)
  const pendingCount = db
    .prepare("SELECT COUNT(*) as count FROM pending_receipts WHERE checkout_token = ? AND claimed = 0")
    .get(checkoutToken).count;

  if (pendingCount >= 5) {
    if (fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }
    return res.status(429).json({
      error: "Перевищено ліміт завантажень чеків для поточної сесії оформлення",
    });
  }

  // Record into pending_receipts table
  const pendingId = "pr_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex");
  db.prepare(`
    INSERT INTO pending_receipts (id, checkout_token, filename, file_path, claimed, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(pendingId, checkoutToken, req.file.filename, req.file.path, Date.now());

  const fileUrl = `/uploads/receipts/${req.file.filename}`;
  return res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    checkoutToken,
  });
}

// Secure Receipt File Serving
export function serveReceiptFile(req, res) {
  const filename = path.basename(req.params.filename || "");
  const filePath = path.join(STORAGE_DIR, filename);

  if (!filename || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Файл чека не знайдено" });
  }

  // 1. Admin access check
  let adminToken = req.cookies?.pasika_session;
  if (!adminToken && req.headers.authorization?.startsWith("Bearer ")) {
    adminToken = req.headers.authorization.substring(7).trim();
  }
  const adminSession = getSession(adminToken);
  if (adminSession) {
    return res.sendFile(filePath);
  }

  // 2. Customer token or checkout token check
  const token = (
    req.query.token ||
    req.headers["x-customer-token"] ||
    req.headers["x-checkout-token"] ||
    ""
  ).trim();

  if (!token) {
    return res.status(403).json({ error: "Доступ до чека заборонено: відсутній токен авторизації" });
  }

  // Check if token matches an order's customer_token
  const order = db
    .prepare("SELECT id FROM orders WHERE customer_token = ? AND (receipt_url LIKE ? OR receipt_name = ?)")
    .get(token, `%${filename}`, filename);

  if (order) {
    return res.sendFile(filePath);
  }

  // Check if token matches an active pending receipt
  const pending = db
    .prepare("SELECT id FROM pending_receipts WHERE checkout_token = ? AND filename = ?")
    .get(token, filename);

  if (pending) {
    return res.sendFile(filePath);
  }

  return res.status(403).json({ error: "Доступ до чека заборонено: недійсний токен" });
}
