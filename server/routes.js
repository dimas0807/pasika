import { Router } from "express";
import {
  changeSecurityHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  requireAdminAuth,
} from "./auth.js";
import {
  getBranchesNovaPoshta,
  getBranchesUkrposhta,
  searchCitiesNovaPoshta,
  searchCitiesUkrposhta,
} from "./delivery.js";
import {
  createOrder,
  getAdminOrders,
  getFullOrder,
  getPublicOrder,
  updateOrderStatus,
} from "./orders.js";
import {
  deleteProduct,
  duplicateProduct,
  getAllProducts,
  getCategories,
  getDashboardStats,
  getProductById,
  getProductBySlug,
  saveProduct,
  saveCategory,
  deleteCategory,
} from "./products.js";
import { getAdminSettings, getPublicSettings, getTelegramLogs, updateSettings } from "./settings.js";
import {
  handleProductImageUpload,
  handleReceiptUpload,
  serveReceiptFile,
  uploadProductImageMulter,
  uploadReceiptMulter,
  uploadReceiptValidationMiddleware,
} from "./storage.js";
import {
  createTelegramRecipient,
  deleteTelegramRecipient,
  getRecentTelegramInteractions,
  getTelegramConfig,
  getTelegramRecipients,
  handleTelegramWebhook,
  testRecipientNotification,
  testTelegramConnection,
  toggleTelegramRecipient,
  updateTelegramConfig,
  updateTelegramRecipient,
} from "./telegram.js";

const router = Router();

// ---------------- Public Routes ----------------

// Auth
router.post("/auth/login", loginHandler);
router.post("/auth/logout", logoutHandler);
router.get("/auth/me", meHandler);

// Products & Categories
router.get("/products", getAllProducts);
router.get("/products/id/:id", getProductById);
router.get("/products/:slug", getProductBySlug);
router.get("/categories", getCategories);

// Settings
router.get("/settings", getPublicSettings);

// Delivery
router.get("/delivery/cities", async (req, res) => {
  const { provider, query } = req.query;
  try {
    if (provider === "up") {
      const cities = await searchCitiesUkrposhta(query);
      return res.json(cities);
    } else {
      const cities = await searchCitiesNovaPoshta(query);
      return res.json(cities);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/delivery/branches", async (req, res) => {
  const { provider, cityId } = req.query;
  try {
    if (provider === "up") {
      const branches = await getBranchesUkrposhta(cityId);
      return res.json(branches);
    } else {
      const branches = await getBranchesNovaPoshta(cityId);
      return res.json(branches);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Receipt File Upload with rate limiting and checkout session validation
router.post("/upload-receipt", uploadReceiptValidationMiddleware, (req, res) => {
  uploadReceiptMulter.fields([
    { name: "file", maxCount: 1 },
    { name: "receipt", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file && req.files) {
      req.file = req.files.file?.[0] || req.files.receipt?.[0] || null;
    }
    handleReceiptUpload(req, res);
  });
});

// Secure receipt access
router.get("/receipts/:filename", serveReceiptFile);
router.get("/uploads/receipts/:filename", serveReceiptFile);

// Orders
router.post("/orders", createOrder);
router.get("/orders/:id", getPublicOrder);

// Telegram Webhook (Public Bot API updates)
router.post("/telegram/webhook", async (req, res) => {
  const result = await handleTelegramWebhook(req.body);
  return res.json(result);
});

// ---------------- Admin Protected Routes ----------------

router.use("/admin", requireAdminAuth);

router.get("/admin/dashboard", getDashboardStats);

router.get("/admin/orders", getAdminOrders);
router.get("/admin/orders/:id", (req, res) => {
  const order = getFullOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Замовлення не знайдено" });
  return res.json(order);
});
router.patch("/admin/orders/:id/status", updateOrderStatus);

router.get("/admin/products", getAllProducts);
router.post("/admin/products", saveProduct);
router.put("/admin/products/:id", saveProduct);
router.delete("/admin/products/:id", deleteProduct);
router.post("/admin/products/:id/duplicate", duplicateProduct);

// Product Image Upload
router.post("/upload-product-image", (req, res) => {
  uploadProductImageMulter.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    handleProductImageUpload(req, res);
  });
});

// Categories Management
router.post("/admin/categories", saveCategory);
router.delete("/admin/categories/:slug", deleteCategory);

// Settings & Security
router.get("/admin/settings", getAdminSettings);
router.put("/admin/settings", updateSettings);
router.put("/admin/security", changeSecurityHandler);

// Telegram Bot Configuration
router.get("/admin/telegram/config", (_req, res) => {
  return res.json(getTelegramConfig());
});

router.put("/admin/telegram/config", (req, res) => {
  try {
    const config = updateTelegramConfig(req.body || {});
    return res.json(config);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post("/admin/telegram/test", async (req, res) => {
  const { botToken, chatId } = req.body || {};
  const result = await testTelegramConnection(botToken, chatId);
  return res.json(result);
});

// Telegram Recipients Management
router.get("/admin/telegram/recipients", (_req, res) => {
  return res.json(getTelegramRecipients());
});

router.post("/admin/telegram/recipients", (req, res) => {
  try {
    const recipient = createTelegramRecipient(req.body || {});
    return res.status(201).json(recipient);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.put("/admin/telegram/recipients/:id", (req, res) => {
  try {
    const recipient = updateTelegramRecipient(req.params.id, req.body || {});
    return res.json(recipient);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete("/admin/telegram/recipients/:id", (req, res) => {
  try {
    const result = deleteTelegramRecipient(req.params.id);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post("/admin/telegram/recipients/:id/toggle", (req, res) => {
  try {
    const result = toggleTelegramRecipient(req.params.id);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post("/admin/telegram/recipients/:id/test", async (req, res) => {
  const result = await testRecipientNotification(req.params.id, req.body?.text);
  if (!result.ok) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// Telegram Start Flow Recent Chats
router.get("/admin/telegram/recent-chats", (req, res) => {
  const limit = req.query?.limit ? Number(req.query.limit) : 10;
  return res.json(getRecentTelegramInteractions(limit));
});

// Telegram Delivery Log
router.get("/admin/telegram-log", getTelegramLogs);

export default router;
