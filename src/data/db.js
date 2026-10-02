// Server-backed data layer for Honey Pasika.
// Connects to the Express & SQLite backend (/api/*), removing any dependency
// on localStorage for critical data.
import { PRODUCTS as SEED_PRODUCTS, CATEGORIES as SEED_CATEGORIES, DEFAULT_SETTINGS as SEED_SETTINGS } from "./seed";

// Clean seed settings without admin credentials
const SAFE_SEED_SETTINGS = {
  store: SEED_SETTINGS.store,
  about: SEED_SETTINGS.about,
  contacts: SEED_SETTINGS.contacts,
  payment: SEED_SETTINGS.payment,
  delivery: SEED_SETTINGS.delivery,
  telegram: SEED_SETTINGS.telegram,
};

// In-memory runtime cache for fast rendering and seamless offline/initial hydration
const state = {
  products: [...SEED_PRODUCTS],
  categories: [...SEED_CATEGORIES],
  settings: { ...SAFE_SEED_SETTINGS },
  orders: [],
  telegramLog: [],
  adminAuthed: false,
  initialized: false,
};

const listeners = new Set();
function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getApiBase() {
  if (typeof window !== "undefined") {
    // If running in browser directly on Railway, use same-origin relative URLs (/api)
    if (window.location.hostname.endsWith(".railway.app")) {
      return "";
    }
    // If running on localhost in browser, use relative URLs (Vite proxy)
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "";
    }
  }
  return (
    import.meta.env?.VITE_API_URL ||
    (import.meta.env?.PROD ? "https://pasika-production.up.railway.app" : "")
  ).replace(/\/$/, "");
}

export const API_BASE = getApiBase();

const TOKEN_STORAGE_KEY = "pasika_admin_token";

export function getAdminToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setAdminToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {}
}

export function resolveReceiptUrl(rawUrl) {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  if (rawUrl.startsWith("/uploads/receipts/")) {
    const filename = rawUrl.replace("/uploads/receipts/", "");
    return `${API_BASE}/api/receipts/${encodeURIComponent(filename)}`;
  }
  if (rawUrl.startsWith("/receipts/")) {
    const filename = rawUrl.replace("/receipts/", "");
    return `${API_BASE}/api/receipts/${encodeURIComponent(filename)}`;
  }
  return `${API_BASE}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

export function resolveImageUrl(rawUrl) {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  if (rawUrl.startsWith("/uploads/")) {
    return `${API_BASE}${rawUrl}`;
  }
  return rawUrl;
}

// Fetch helper with error handling, credentials and Bearer token fallback
export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const token = getAdminToken();
  const fetchOptions = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  };

  let res;
  try {
    res = await fetch(url, fetchOptions);
  } catch {
    const err = new Error("Не вдалося підключитися до сервера. Перевірте інтернет-з'єднання.");
    err.status = 0;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    let errorMsg = data?.error || data?.message;
    if (!errorMsg) {
      if (res.status === 401) {
        errorMsg = "Невірний логін або пароль";
      } else if (res.status === 403) {
        errorMsg = "Недостатньо прав";
      } else if (res.status === 404) {
        errorMsg = "Admin API endpoint не знайдено";
      } else if (res.status === 429) {
        errorMsg = "Забагато спроб запиту. Спробуйте пізніше.";
      } else if (res.status >= 500) {
        errorMsg = "Помилка сервера. Спробуйте пізніше.";
      } else {
        errorMsg = res.statusText || "Помилка сервера";
      }
    }
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  // Guard: if status is ok, but not JSON (e.g. static host served index.html with 200)
  if (!contentType.includes("application/json") || data === null) {
    const err = new Error("Сервер повернув неочікувану відповідь (API недоступний)");
    err.status = res.status;
    throw err;
  }

  return data;
}

// Initialize database data from server on startup
export async function initDb() {
  try {
    const [products, categories, settings] = await Promise.allSettled([
      request("/api/products"),
      request("/api/categories"),
      request("/api/settings"),
    ]);

    if (products.status === "fulfilled" && Array.isArray(products.value) && products.value.length > 0) {
      state.products = products.value;
    }
    if (categories.status === "fulfilled" && Array.isArray(categories.value) && categories.value.length > 0) {
      state.categories = categories.value;
    }
    if (
      settings.status === "fulfilled" &&
      settings.value &&
      typeof settings.value === "object" &&
      !Array.isArray(settings.value) &&
      settings.value.contacts
    ) {
      state.settings = settings.value;
    }

    state.initialized = true;
    notify();
  } catch (err) {
    console.warn("[initDb] Could not pre-fetch data from server, using in-memory cache:", err.message);
  }

  // Also check admin session in background
  Auth.checkSession().catch(() => {});
}

// ---------------- Categories ----------------
export const Categories = {
  all: () => (Array.isArray(state.categories) && state.categories.length > 0 ? state.categories : SEED_CATEGORIES),
  fetchAll: async () => {
    try {
      const data = await request("/api/categories");
      if (Array.isArray(data) && data.length > 0) {
        state.categories = data;
        notify();
      }
      return Categories.all();
    } catch {
      return Categories.all();
    }
  },
  save: async (cat) => {
    const saved = await request("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(cat),
    });
    const idx = state.categories.findIndex((c) => c.slug === saved.slug);
    if (idx >= 0) state.categories[idx] = saved;
    else state.categories.push(saved);
    notify();
    return saved;
  },
  delete: async (slug) => {
    await request(`/api/admin/categories/${slug}`, { method: "DELETE" });
    state.categories = state.categories.filter((c) => c.slug !== slug);
    notify();
    return true;
  },
};

// ---------------- Products ----------------
export const Products = {
  all: () => (Array.isArray(state.products) && state.products.length > 0 ? state.products : SEED_PRODUCTS),
  fetchAll: async () => {
    try {
      const data = await request("/api/products");
      if (Array.isArray(data) && data.length > 0) {
        state.products = data;
        notify();
      }
      return Products.all();
    } catch {
      return Products.all();
    }
  },
  bySlug: (slug) => {
    const list = Array.isArray(state.products) && state.products.length > 0 ? state.products : SEED_PRODUCTS;
    return list.find((p) => p.slug === slug);
  },
  fetchBySlug: async (slug) => {
    try {
      const data = await request(`/api/products/${slug}`);
      if (data && typeof data === "object" && data.id) {
        const idx = state.products.findIndex((p) => p.slug === slug || p.id === data.id);
        if (idx >= 0) state.products[idx] = data;
        else state.products.push(data);
        notify();
        return data;
      }
      return Products.bySlug(slug);
    } catch {
      return Products.bySlug(slug);
    }
  },
  byId: (id) => {
    const list = Array.isArray(state.products) && state.products.length > 0 ? state.products : SEED_PRODUCTS;
    return list.find((p) => p.id === id);
  },
  fetchById: async (id) => {
    try {
      const data = await request(`/api/products/id/${id}`);
      if (data && typeof data === "object" && data.id) {
        const idx = state.products.findIndex((p) => p.id === id);
        if (idx >= 0) state.products[idx] = data;
        else state.products.push(data);
        notify();
        return data;
      }
      return Products.byId(id);
    } catch {
      return Products.byId(id);
    }
  },
  byCategory: (cat) => {
    const list = Array.isArray(state.products) && state.products.length > 0 ? state.products : SEED_PRODUCTS;
    return list.filter((p) => p.category === cat);
  },
  featured: () => {
    const list = Array.isArray(state.products) && state.products.length > 0 ? state.products : SEED_PRODUCTS;
    return list.filter((p) => p.featured);
  },
  save: async (product) => {
    const isNew = !product.id || product.id.startsWith("new_") || !state.products.some((p) => p.id === product.id);
    const endpoint = isNew ? "/api/admin/products" : `/api/admin/products/${product.id}`;
    const method = isNew ? "POST" : "PUT";

    const saved = await request(endpoint, {
      method,
      body: JSON.stringify(product),
    });

    const idx = state.products.findIndex((p) => p.id === saved.id);
    if (idx >= 0) state.products[idx] = saved;
    else state.products.unshift(saved);
    notify();
    return saved;
  },
  remove: async (id) => {
    await request(`/api/admin/products/${id}`, { method: "DELETE" });
    state.products = state.products.filter((p) => p.id !== id);
    notify();
    return true;
  },
  duplicate: async (id) => {
    const duplicated = await request(`/api/admin/products/${id}/duplicate`, { method: "POST" });
    state.products.unshift(duplicated);
    notify();
    return duplicated;
  },
  validateStock: async (items) => {
    return await request("/api/products/validate-stock", {
      method: "POST",
      body: JSON.stringify({ items: items.map((i) => ({ id: i.id, qty: i.qty })) }),
    });
  },
};

// ---------------- Orders ----------------
export const Orders = {
  all: () => state.orders,
  fetchAll: async (filters = {}) => {
    try {
      let query = "";
      if (typeof filters === "string") {
        query = filters && filters !== "all" ? `?status=${filters}` : "";
      } else if (filters && typeof filters === "object") {
        const searchParams = new URLSearchParams();
        if (filters.status && filters.status !== "all") searchParams.set("status", filters.status);
        if (filters.deleted) searchParams.set("deleted", filters.deleted);
        if (filters.search) searchParams.set("search", filters.search);
        if (filters.customerId) searchParams.set("customerId", filters.customerId);
        if (filters.startDate) searchParams.set("startDate", filters.startDate);
        if (filters.endDate) searchParams.set("endDate", filters.endDate);
        const qs = searchParams.toString();
        if (qs) query = `?${qs}`;
      }

      const orders = await request(`/api/admin/orders${query}`);
      state.orders = orders;
      notify();
      return orders;
    } catch {
      return state.orders;
    }
  },
  byId: (id) => {
    const mem = state.orders.find((o) => o.id === id || o.orderCode === id);
    if (mem) return mem;
    try {
      const stored = JSON.parse(localStorage.getItem("pasika_recent_orders") || "[]");
      const found = stored.find((o) => o.id === id || o.orderCode === id);
      if (found) return found;
    } catch {}
    return null;
  },
  fetchById: async (id, token = null) => {
    try {
      // Try public order endpoint with token
      const query = token ? `?token=${encodeURIComponent(token)}` : "";
      const order = await request(`/api/orders/${id}${query}`);
      const idx = state.orders.findIndex((o) => o.id === id);
      if (idx >= 0) state.orders[idx] = order;
      else state.orders.push(order);
      notify();
      return order;
    } catch {
      // If public fails, try admin endpoint if authed
      try {
        const order = await request(`/api/admin/orders/${id}`);
        const idx = state.orders.findIndex((o) => o.id === id);
        if (idx >= 0) state.orders[idx] = order;
        else state.orders.push(order);
        notify();
        return order;
      } catch {
        return Orders.byId(id);
      }
    }
  },
  create: async (orderPayload) => {
    const res = await request("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });
    if (res.order) {
      const orderWithToken = {
        ...res.order,
        customerToken: res.customerToken,
      };
      state.orders.unshift(orderWithToken);
      try {
        const stored = JSON.parse(localStorage.getItem("pasika_recent_orders") || "[]");
        stored.unshift(orderWithToken);
        localStorage.setItem("pasika_recent_orders", JSON.stringify(stored.slice(0, 30)));
      } catch {}
      notify();
      return orderWithToken;
    }
    return res;
  },
  updateStatus: async (id, status, comment = null) => {
    const updated = await request(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, comment }),
    });
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx >= 0) state.orders[idx] = updated;
    notify();
    return updated;
  },
  updateTracking: async (id, trackingData) => {
    const updated = await request(`/api/admin/orders/${id}/tracking`, {
      method: "PATCH",
      body: JSON.stringify(trackingData),
    });
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx >= 0) state.orders[idx] = updated;
    notify();
    return updated;
  },
  delete: async (id) => {
    const res = await request(`/api/admin/orders/${id}`, {
      method: "DELETE",
    });
    state.orders = state.orders.filter((o) => o.id !== id);
    notify();
    return res;
  },
  restore: async (id) => {
    const res = await request(`/api/admin/orders/${id}/restore`, {
      method: "POST",
    });
    if (res.order) {
      const idx = state.orders.findIndex((o) => o.id === id);
      if (idx >= 0) state.orders[idx] = res.order;
      else state.orders.unshift(res.order);
      notify();
    }
    return res;
  },
  confirmPayment: async (id) => {
    const res = await request(`/api/admin/orders/${id}/confirm-payment`, {
      method: "POST",
    });
    const updated = res.order || res;
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx >= 0) state.orders[idx] = updated;
    notify();
    return updated;
  },
  track: async (code) => {
    try {
      return await request(`/api/orders/track/${encodeURIComponent(code)}`);
    } catch (err) {
      // Local fallback for client resilience
      try {
        const stored = JSON.parse(localStorage.getItem("pasika_recent_orders") || "[]");
        const clean = code.trim().toLowerCase();
        const found = stored.find(
          (o) =>
            o.orderCode?.toLowerCase() === clean ||
            o.order_code?.toLowerCase() === clean ||
            o.id?.toLowerCase() === clean ||
            String(o.number) === clean.replace(/^pas-/i, "") ||
            o.delivery?.trackingNumber === code.trim()
        );
        if (found) {
          return {
            found: true,
            id: found.id,
            number: found.number,
            orderCode: found.orderCode || `PAS-${found.number}`,
            order_code: found.orderCode || `PAS-${found.number}`,
            status: found.status,
            createdAt: found.createdAt,
            total: found.total,
            delivery: found.delivery,
            items: found.items || [],
          };
        }
      } catch {}
      throw err;
    }
  },
};

// ---------------- Delivery Accounts ----------------
export const DeliveryAccounts = {
  getAll: async (provider) => {
    return await request(`/api/admin/delivery/accounts${provider ? `?provider=${provider}` : ""}`);
  },
  create: async (account) => {
    return await request("/api/admin/delivery/accounts", {
      method: "POST",
      body: JSON.stringify(account),
    });
  },
  update: async (id, account) => {
    return await request(`/api/admin/delivery/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(account),
    });
  },
  remove: async (id) => {
    return await request(`/api/admin/delivery/accounts/${id}`, {
      method: "DELETE",
    });
  },
  checkApi: async (provider, apiKey) => {
    return await request("/api/admin/delivery/check", {
      method: "POST",
      body: JSON.stringify({ provider, apiKey }),
    });
  },
  createOrderTtn: async (orderId, form) => {
    return await request(`/api/admin/delivery/orders/${orderId}/ttn`, {
      method: "POST",
      body: JSON.stringify(form),
    });
  },
  cancelOrderTtn: async (orderId) => {
    return await request(`/api/admin/delivery/orders/${orderId}/ttn`, {
      method: "DELETE",
    });
  },
  getOrderTracking: async (orderId) => {
    return await request(`/api/admin/delivery/orders/${orderId}/tracking`);
  },
};

// ---------------- Customers ----------------
export const Customers = {
  fetchAll: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.sort) searchParams.set("sort", params.sort);
    const qs = searchParams.toString();
    return await request(`/api/admin/customers${qs ? `?${qs}` : ""}`);
  },
  fetchById: async (id) => {
    return await request(`/api/admin/customers/${id}`);
  },
};

// ---------------- Backups ----------------
export const Backups = {
  list: async () => {
    return await request("/api/admin/backups");
  },
  create: async () => {
    return await request("/api/admin/backup/create", { method: "POST" });
  },
  downloadUrl: `${API_BASE}/api/admin/backup`,
  downloadSpecificUrl: (filename) => `${API_BASE}/api/admin/backups/${encodeURIComponent(filename)}`,
};

// ---------------- Settings ----------------
export const Settings = {
  get: () =>
    state.settings && typeof state.settings === "object" && !Array.isArray(state.settings) && state.settings.contacts
      ? state.settings
      : SAFE_SEED_SETTINGS,
  fetch: async () => {
    try {
      const settings = await request("/api/settings");
      if (settings && typeof settings === "object" && !Array.isArray(settings) && settings.contacts) {
        state.settings = settings;
        notify();
      }
      return Settings.get();
    } catch {
      return Settings.get();
    }
  },
  fetchAdmin: async () => {
    try {
      const settings = await request("/api/admin/settings");
      if (settings && typeof settings === "object" && !Array.isArray(settings)) {
        state.settings = settings;
        notify();
      }
      return Settings.get();
    } catch {
      return Settings.get();
    }
  },
  save: async (settings) => {
    const updated = await request("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    if (updated && typeof updated === "object") {
      state.settings = updated;
      notify();
    }
    return updated;
  },
};

// ---------------- Telegram Log ----------------
export const TelegramLog = {
  all: () => state.telegramLog,
  fetchAll: async (limit = 20) => {
    try {
      const logs = await request(`/api/admin/telegram-log?limit=${limit}`);
      state.telegramLog = logs;
      notify();
      return logs;
    } catch {
      return state.telegramLog;
    }
  },
};

// ---------------- Admin Auth ----------------
export const Auth = {
  isAuthed: () => state.adminAuthed,
  getUsername: () => state.adminUsername || "admin",
  getToken: getAdminToken,
  setToken: setAdminToken,
  checkSession: async () => {
    try {
      const res = await request("/api/auth/me");
      state.adminAuthed = Boolean(res?.authenticated);
      if (res?.username) {
        state.adminUsername = res.username;
      }
      notify();
      return state.adminAuthed;
    } catch {
      state.adminAuthed = false;
      notify();
      return false;
    }
  },
  login: async (login, password) => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    });
    if (res.success) {
      if (res.token) {
        setAdminToken(res.token);
      }
      state.adminAuthed = true;
      state.adminUsername = res.username || login.trim();
      notify();
      return true;
    }
    return false;
  },
  logout: async () => {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } finally {
      setAdminToken(null);
      state.adminAuthed = false;
      state.adminUsername = null;
      notify();
    }
  },
  updateSecurity: async ({ currentPassword, newLogin, newPassword, confirmPassword }) => {
    const res = await request("/api/admin/security", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newLogin, newPassword, confirmPassword }),
    });
    if (res?.success && res?.username) {
      state.adminUsername = res.username;
      notify();
    }
    return res;
  },
};

export const Storage = {
  uploadReceipt: async (file, checkoutToken) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("receipt", file);
    if (checkoutToken) {
      formData.append("checkoutToken", checkoutToken);
    }

    const url = `${API_BASE}/api/upload-receipt`;
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: checkoutToken ? { "x-checkout-token": checkoutToken } : {},
      });
    } catch {
      throw new Error("Не вдалося підключитися до сервера для завантаження чека.");
    }

    const contentType = res.headers.get("content-type") || "";
    let data = null;
    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      const errorMsg = data?.error || "Не вдалося завантажити чек. Спробуйте ще раз.";
      throw new Error(errorMsg);
    }

    if (!data || !data.fileUrl) {
      throw new Error("Не вдалося завантажити чек. Спробуйте ще раз.");
    }

    return {
      fileUrl: data.fileUrl,
      name: data.originalName || file.name,
      filename: data.filename,
    };
  },
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("image", file);

    const token = getAdminToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${API_BASE}/api/upload-product-image`;
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });
    } catch {
      throw new Error("Не вдалося підключитися до сервера для завантаження фото товару.");
    }

    const contentType = res.headers.get("content-type") || "";
    let data = null;
    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      const errorMsg = data?.error || "Не вдалося завантажити фото товару. Спробуйте ще раз.";
      throw new Error(errorMsg);
    }

    if (!data || !data.fileUrl) {
      throw new Error("Не вдалося завантажити фото товару. Спробуйте ще раз.");
    }

    return {
      fileUrl: data.fileUrl,
      name: data.originalName || file.name,
      filename: data.filename,
    };
  },
};

// ---------------- Telegram Bot API ----------------
export const Telegram = {
  getConfig: async () => {
    return await request("/api/admin/telegram/config");
  },
  updateConfig: async (config) => {
    return await request("/api/admin/telegram/config", {
      method: "PUT",
      body: JSON.stringify(config),
    });
  },
  testConnection: async ({ botToken, chatId } = {}) => {
    return await request("/api/admin/telegram/test", {
      method: "POST",
      body: JSON.stringify({ botToken, chatId }),
    });
  },
  getRecipients: async () => {
    return await request("/api/admin/telegram/recipients");
  },
  createRecipient: async (recipient) => {
    return await request("/api/admin/telegram/recipients", {
      method: "POST",
      body: JSON.stringify(recipient),
    });
  },
  updateRecipient: async (id, recipient) => {
    return await request(`/api/admin/telegram/recipients/${id}`, {
      method: "PUT",
      body: JSON.stringify(recipient),
    });
  },
  deleteRecipient: async (id) => {
    return await request(`/api/admin/telegram/recipients/${id}`, {
      method: "DELETE",
    });
  },
  toggleRecipient: async (id) => {
    return await request(`/api/admin/telegram/recipients/${id}/toggle`, {
      method: "POST",
    });
  },
  testRecipient: async (id, text = "") => {
    return await request(`/api/admin/telegram/recipients/${id}/test`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
  getRecentChats: async (limit = 10) => {
    return await request(`/api/admin/telegram/recent-chats?limit=${limit}`);
  },
};
