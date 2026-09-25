import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initDatabase } from "./db.js";
import apiRouter from "./routes.js";
import { serveReceiptFile, STORAGE_DIR, PRODUCTS_STORAGE_DIR } from "./storage.js";

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Initialize SQLite database
initDatabase();

export const app = express();

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded product photos publicly
app.use("/uploads/products", express.static(PRODUCTS_STORAGE_DIR));

// Securely serve uploaded receipts (requires admin auth or customer/checkout token)
app.get("/uploads/receipts/:filename", serveReceiptFile);

// API Routes
app.use("/api", apiRouter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

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
  app.listen(PORT, () => {
    console.log(`🍯 Honey Pasika backend server listening on http://localhost:${PORT}`);
    console.log(`📦 Storage directory: ${STORAGE_DIR}`);
  });
}
