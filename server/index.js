import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load environment variables early
dotenv.config();

import { initDatabase } from "./db.js";
import apiRouter from "./routes.js";
import { serveReceiptFile, STORAGE_DIR, PRODUCTS_STORAGE_DIR } from "./storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Initialize SQLite database
initDatabase();

export const app = express();

// Configure CORS for production frontend and local development
const ALLOWED_ORIGINS = new Set([
  "https://galinka.pages.dev",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, "")] : []),
  ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN.replace(/\/$/, "")] : []),
]);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow requests without Origin (same-origin, curl, server-to-server)
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Allow Cloudflare Pages preview domains like https://xxx.pages.dev
  if (/^https:\/\/([a-z0-9-]+\.)?pages\.dev$/.test(origin)) return true;
  // Allow Railway / hosting domains
  if (/^https:\/\/([a-z0-9-]+\.)*railway\.app$/.test(origin)) return true;
  // Allow localhost & 127.0.0.1 development ports
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-customer-token", "x-checkout-token"],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint (minimal, no internal secrets)
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({ ok: true });
});

// Serve uploaded product photos publicly
app.use("/uploads/products", express.static(PRODUCTS_STORAGE_DIR));

// Securely serve uploaded receipts (requires admin auth or customer/checkout token)
app.get("/uploads/receipts/:filename", serveReceiptFile);

// API Routes
app.use("/api", apiRouter);

// Production: serve built static files from dist/
const DIST_DIR = path.resolve(__dirname, "../dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
      return res.sendFile(path.join(DIST_DIR, "index.html"));
    }
    next();
  });
}

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[Server Error]:", err);
  res.status(err.status || 500).json({
    error: err.message || "Внутрішня помилка сервера",
  });
});

// Start listening if run directly
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🥩 М'ясний рай у Галинки backend server listening on http://0.0.0.0:${PORT}`);
    console.log(`📦 Storage directory: ${STORAGE_DIR}`);
  });
}
