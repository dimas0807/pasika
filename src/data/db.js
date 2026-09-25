// Server-backed data layer for Honey Pasika.
// Connects to the Express & SQLite backend (/api/*), removing any dependency
// on localStorage for critical data.
import { PRODUCTS as SEED_PRODUCTS, CATEGORIES as SEED_CATEGORIES, DEFAULT_SETTINGS as SEED_SETTINGS } from "./seed";

// Clean seed settings without admin credentials
const SAFE_SEED_SETTINGS = {
  contacts: SEED_SETTINGS.contacts,
  payment: SEED_SETTINGS.payment,
  delivery: SEED_SETTINGS.delivery,
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

// Fetch helper with error handling and credentials
async function request(endpoint, options = {}) {
  const fetchOptions = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "same-origin",
  };

  const res = await fetch(endpoint, fetchOptions);
  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.error || res.statusText || "Помилка сервера";
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
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

    if (products.status === "fulfilled" && Array.isArray(products.value)) {
      state.products = products.value;
    }
    if (categories.status === "fulfilled" && Array.isArray(categories.value)) {
      state.categories = categories.value;
    }
    if (settings.status === "fulfilled" && settings.value) {
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
  all: () => state.categories,
  fetchAll: async () => {
    try {
      const data = await request("/api/categories");
      state.categories = data;
      notify();
      return data;
    } catch {
      return state.categories;
    }
  },
};

// ---------------- Products ----------------
export const Products = {
  all: () => state.products,
  fetchAll: async () => {
    try {
      const data = await request("/api/products");
      state.products = data;
      notify();
      return data;
    } catch {
      return state.products;
    }
  },
  bySlug: (slug) => state.products.find((p) => p.slug === slug),
  fetchBySlug: async (slug) => {
    try {
      const data = await request(`/api/products/${slug}`);
      const idx = state.products.findIndex((p) => p.slug === slug || p.id === data.id);
      if (idx >= 0) state.products[idx] = data;
      else state.products.push(data);
      notify();
      return data;
    } catch {
      return Products.bySlug(slug);
    }
  },
  byId: (id) => state.products.find((p) => p.id === id),
  fetchById: async (id) => {
    try {
      const data = await request(`/api/products/id/${id}`);
      const idx = state.products.findIndex((p) => p.id === id);
      if (idx >= 0) state.products[idx] = data;
      else state.products.push(data);
      notify();
      return data;
    } catch {
      return Products.byId(id);
    }
  },
  byCategory: (cat) => state.products.filter((p) => p.category === cat),
  featured: () => state.products.filter((p) => p.featured),
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
};

// ---------------- Orders ----------------
export const Orders = {
  all: () => state.orders,
  fetchAll: async (status) => {
    try {
      const query = status && status !== "all" ? `?status=${status}` : "";
      const orders = await request(`/api/admin/orders${query}`);
      state.orders = orders;
      notify();
      return orders;
    } catch {
      return state.orders;
    }
  },
  byId: (id) => state.orders.find((o) => o.id === id),
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
      notify();
      return orderWithToken;
    }
    return res;
  },
  updateStatus: async (id, status) => {
    const updated = await request(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx >= 0) state.orders[idx] = updated;
    notify();
    return updated;
  },
};

// ---------------- Settings ----------------
export const Settings = {
  get: () => state.settings,
  fetch: async () => {
    try {
      const settings = await request("/api/settings");
      state.settings = settings;
      notify();
      return settings;
    } catch {
      return state.settings;
    }
  },
  save: async (settings) => {
    const updated = await request("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    state.settings = updated;
    notify();
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
  checkSession: async () => {
    try {
      const res = await request("/api/auth/me");
      state.adminAuthed = Boolean(res?.authenticated);
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
      state.adminAuthed = true;
      notify();
      return true;
    }
    return false;
  },
  logout: async () => {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } finally {
      state.adminAuthed = false;
      notify();
    }
  },
};

// ---------------- File Storage ----------------
export const Storage = {
  uploadReceipt: async (file, checkoutToken) => {
    const formData = new FormData();
    formData.append("file", file);
    if (checkoutToken) {
      formData.append("checkoutToken", checkoutToken);
    }

    const res = await fetch("/api/upload-receipt", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Не вдалося завантажити чек");
    }

    return {
      fileUrl: data.fileUrl,
      name: data.originalName,
      filename: data.filename,
    };
  },
};
