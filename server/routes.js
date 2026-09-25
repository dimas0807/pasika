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
import { testTelegramConnection } from "./telegram.js";

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

// Orders
router.post("/orders", createOrder);
router.get("/orders/:id", getPublicOrder);

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

// Settings & Telegram
router.get("/admin/settings", getAdminSettings);
router.put("/admin/settings", updateSettings);
router.put("/admin/security", changeSecurityHandler);
router.get("/admin/telegram-log", getTelegramLogs);
router.post("/admin/telegram/test", async (req, res) => {
  const { botToken, chatId } = req.body || {};
  const result = await testTelegramConnection(botToken, chatId);
  return res.json(result);
});

export default router;
