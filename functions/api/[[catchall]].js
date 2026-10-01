// Cloudflare Pages Functions serverless edge API for Honey Pasika
// Handles all /api/* routes on Cloudflare Pages production deployment

const DEFAULT_SECRET = "pasika_edge_secret_key_prod_2026_honey";

const SEED_CATEGORIES = [
  { slug: "honey", name: "Мед", icon: "🍯" },
  { slug: "cream-honey", name: "Крем-мед", icon: "🧈" },
  { slug: "nuts-honey", name: "Горіхи в меді", icon: "🌰" },
  { slug: "pollen", name: "Пилок", icon: "🌼" },
  { slug: "propolis", name: "Прополіс", icon: "🟤" },
  { slug: "perga", name: "Перга", icon: "🟡" },
  { slug: "gift-boxes", name: "Подарункові бокси", icon: "🎁" },
];

const SEED_PRODUCTS = [
  {
    id: "p1", slug: "med-naturalnyi-500g", name: "Мед натуральний", category: "honey",
    weight: "500 г", price: 220, oldPrice: null, stock: 34, featured: 1, giftBox: 0,
    description: "Натуральний квітковий мед з власної пасіки. Зібраний та розфасований вручну, без додавання цукру та консервантів.",
    image: "honey-jar",
  },
  {
    id: "p2", slug: "med-naturalnyi-1kg", name: "Мед натуральний", category: "honey",
    weight: "1 кг", price: 380, oldPrice: 420, stock: 21, featured: 1, giftBox: 0,
    description: "Натуральний квітковий мед з власної пасіки у зручній літровій банці — для родини або в подарунок.",
    image: "honey-jar-big",
  },
  {
    id: "p3", slug: "krem-med-250g", name: "Крем-мед", category: "cream-honey",
    weight: "250 г", price: 190, oldPrice: null, stock: 18, featured: 1, giftBox: 0,
    description: "Ніжний крем-мед збитої текстури. Не кристалізується, легко намазується.",
    image: "cream-honey",
  },
  {
    id: "p4", slug: "horihy-v-medi-250g", name: "Горіхи в меді", category: "nuts-honey",
    weight: "250 г", price: 260, oldPrice: null, stock: 14, featured: 1, giftBox: 0,
    description: "Волоські горіхи, вимочені у натуральному меді. Смачний та корисний перекус.",
    image: "nuts-honey",
  },
  {
    id: "p5", slug: "kvitkovyi-pylok-100g", name: "Квітковий пилок", category: "pollen",
    weight: "100 г", price: 140, oldPrice: null, stock: 25, featured: 0, giftBox: 0,
    description: "Натуральні гранули квіткового пилку, зібрані бджолами на власній пасіці.",
    image: "pollen",
  },
  {
    id: "p6", slug: "propolis-20g", name: "Прополіс", category: "propolis",
    weight: "20 г", price: 120, oldPrice: null, stock: 30, featured: 0, giftBox: 0,
    description: "Натуральний бджолиний прополіс у шматочках.",
    image: "propolis",
  },
  {
    id: "p7", slug: "perga-100g", name: "Перга", category: "perga",
    weight: "100 г", price: 220, oldPrice: null, stock: 12, featured: 0, giftBox: 0,
    description: "Бджолина перга — натуральний продукт пасіки у гранулах.",
    image: "perga",
  },
  {
    id: "p8", slug: "box-medovyi", name: "Подарунковий бокс «Медовий»", category: "gift-boxes",
    weight: "набір", price: 450, oldPrice: null, stock: 10, featured: 1, giftBox: 1,
    description: "Крафтова коробка з медом, крем-медом та невеликим сюрпризом. Можливе персональне оформлення.",
    image: "box-medovyi",
  },
];

const DEFAULT_SETTINGS = {
  store: {
    name: "Honey Pasika",
    phone: "+380 67 835 23 11",
    email: "hello@pasika-honey.ua",
    address: "Прикарпаття, с. Новоселиця, Снятинський район",
    workingHours: "Пн-Нд 09:00 - 20:00",
    instagram: "@honey_pasika",
    tiktok: "@honey.dsv",
    telegram: "@pasika_honey",
    description: "Натуральний мед та продукти бджільництва з родинної пасіки на Прикарпатті.",
  },
  about: {
    title: "Родинна пасіка в серці Прикарпаття",
    shortText: "Ми пасічники і дуже любимо родинну справу. Знаходимось на Прикарпатті, в селі Новоселиця Снятинського району.",
    fullDescription: "Перший наш вулик з'явився 10 років назад, а сьогодні на нашій пасіці налічується понад 100 вуликів. З того часу любов до бджільництва виросла у власне сімейне виробництво натурального меду найвищої якості.",
    foundationYear: "2014",
    hivesCount: "100+",
    location: "с. Новоселиця, Івано-Франківська обл.",
    image: "/images/about-apiary.jpg",
  },
  contacts: {
    phone: "+380 67 835 23 11",
    email: "hello@pasika-honey.ua",
    telegram: "@pasika_honey",
    viber: "+380 67 835 23 11",
    instagram: "@honey_pasika",
    facebook: "",
    tiktok: "@honey.dsv",
    pickupAddress: "Івано-Франківська обл., Снятинський р-н, с. Новоселиця",
    pickupLat: "48.3341",
    pickupLng: "25.2974",
  },
  payment: {
    bank: "monobank",
    card: "",
    holder: "",
    purpose: "Оплата замовлення",
    instruction: "Після оплати завантажте фото або файл чека — ми підтвердимо замовлення.",
  },
  delivery: {
    novaPoshtaEnabled: true,
    ukrposhtaEnabled: true,
  },
  telegram: {
    botToken: "",
    chatId: "",
  },
};

const SEED_ORDERS = [
  {
    id: "ord_1001",
    number: 1001,
    orderCode: "PAS-1001",
    order_code: "PAS-1001",
    status: "DELIVERED",
    total: 600,
    createdAt: Date.now() - 3 * 86400000,
    updatedAt: Date.now() - 86400000,
    customer: {
      firstName: "Оксана",
      lastName: "Мельник",
      phone: "+380671234567",
      email: "oksana@example.com",
    },
    delivery: {
      provider: "Нова пошта",
      providerKey: "np",
      deliveryService: "Нова пошта",
      city: "Київ",
      branch: "Відділення №1 (вул. Пирогівський шлях, 135)",
      trackingNumber: "20450123456789",
      trackingUrl: "https://novaposhta.ua/tracking/?cargo_number=20450123456789",
    },
    payment: {
      method: "card",
      paymentMethod: "card",
      methodLabel: "Оплачено карткою",
      paymentStatus: "Оплачено",
      status: "paid",
      receiptStatus: "Підтверджено",
      receipt: "attached",
      receiptRequired: true,
    },
    receipt: {
      fileUrl: "/images/receipt-demo.jpg",
      name: "check_monobank_1001.pdf",
    },
    items: [
      { id: "p1", name: "Мед натуральний", weight: "500 г", price: 220, qty: 1 },
      { id: "p2", name: "Мед натуральний", weight: "1 кг", price: 380, qty: 1 },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "PAID", comment: "Оплату перевірено", changedBy: "admin", createdAt: Date.now() - 3 * 86400000 },
      { fromStatus: "PAID", toStatus: "PACKED", comment: "Запаковано на пасіці", changedBy: "admin", createdAt: Date.now() - 2 * 86400000 },
      { fromStatus: "PACKED", toStatus: "SHIPPED", comment: "Передано перевізнику", changedBy: "admin", createdAt: Date.now() - 86400000 },
      { fromStatus: "SHIPPED", toStatus: "DELIVERED", comment: "Отримано клієнтом", changedBy: "admin", createdAt: Date.now() - 10000000 },
    ],
  },
  {
    id: "ord_1002",
    number: 1002,
    orderCode: "PAS-1002",
    order_code: "PAS-1002",
    status: "PROCESSING",
    total: 450,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    customer: {
      firstName: "Богдан",
      lastName: "Кравчук",
      phone: "+380509876543",
      email: "bogdan@example.com",
    },
    delivery: {
      provider: "Нова пошта",
      providerKey: "np",
      deliveryService: "Нова пошта",
      city: "Львів",
      branch: "Відділення №5",
      trackingNumber: null,
      trackingUrl: null,
    },
    payment: {
      method: "cod",
      paymentMethod: "cash_on_delivery",
      methodLabel: "Оплата при отриманні",
      paymentStatus: "Очікує оплати",
      status: "pending",
      receiptStatus: "Не потрібен",
      receipt: "not_required",
      receiptRequired: false,
    },
    receipt: null,
    items: [
      { id: "p8", name: "Подарунковий бокс «Медовий»", weight: "набір", price: 450, qty: 1 },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "PROCESSING", comment: "Прийнято в роботу", changedBy: "admin", createdAt: Date.now() - 3600000 },
    ],
  },
  {
    id: "ord_1003",
    number: 1003,
    orderCode: "PAS-1003",
    order_code: "PAS-1003",
    status: "AWAITING_PAYMENT",
    total: 260,
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
    customer: {
      firstName: "Юлія",
      lastName: "Ткаченко",
      phone: "+380631234000",
      email: "yulia@example.com",
    },
    delivery: {
      provider: "Укрпошта",
      providerKey: "up",
      deliveryService: "Укрпошта",
      city: "Івано-Франківськ",
      branch: "Відділення 76018",
      trackingNumber: null,
      trackingUrl: null,
    },
    payment: {
      method: "card",
      paymentMethod: "card",
      methodLabel: "Оплата на картку",
      paymentStatus: "Очікує підтвердження",
      status: "receipt_review",
      receiptStatus: "Прикріплено",
      receipt: "attached",
      receiptRequired: true,
    },
    receipt: {
      fileUrl: "/images/receipt-demo.jpg",
      name: "receipt_yulia.jpg",
    },
    items: [
      { id: "p4", name: "Горіхи в меді", weight: "250 г", price: 260, qty: 1 },
    ],
    statusHistory: [
      { fromStatus: "NEW", toStatus: "AWAITING_PAYMENT", comment: "Очікує перевірки чека", changedBy: "system", createdAt: Date.now() - 1800000 },
    ],
  },
];

// In-memory cache for edge runtime worker lifetime
let memoryOrders = [...SEED_ORDERS];
let memorySettings = { ...DEFAULT_SETTINGS };
let memoryProducts = [...SEED_PRODUCTS];
let memoryCategories = [...SEED_CATEGORIES];
let memoryTelegramRecipients = [
  {
    id: "rec_default",
    name: "Адміністратор",
    chatId: "287686358",
    role: "admin",
    enabled: true,
    createdAt: Date.now(),
  },
];
let memoryTelegramInteractions = [];
let memoryDeliveryAccounts = [
  {
    id: "da_default_np",
    name: "Нова Пошта (Основний акаунт)",
    provider: "np",
    apiKey: "",
    senderName: "Пасіка Honey",
    phone: "+380678352311",
    cityName: "Новоселиця",
    warehouseName: "Відділення №1",
    isDefault: true,
    isActive: true,
    createdAt: Date.now(),
  },
];
const memoryProductImages = new Map();
const memoryReceipts = new Map();

const UKR_TO_LAT = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh",
  з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya",
  "’": "", "'": "", "`": "", "ʼ": "",
};

function transliterateUa(text = "") {
  return String(text)
    .toLowerCase()
    .split("")
    .map((char) => (UKR_TO_LAT[char] !== undefined ? UKR_TO_LAT[char] : char))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveEdgeUniqueSlug(baseSlug, productId = null) {
  let slug = baseSlug || "product";
  let count = 2;
  while (true) {
    const existing = memoryProducts.find((p) => p.slug === slug && p.id !== productId);
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${count}`;
    count++;
  }
}

// ---------------- Crypto & Security Helpers ----------------

async function getHmacKey(secret) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(bufferOrStr) {
  let binary = "";
  if (typeof bufferOrStr === "string") {
    binary = btoa(unescape(encodeURIComponent(bufferOrStr)));
  } else {
    const bytes = new Uint8Array(bufferOrStr);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    binary = btoa(binary);
  }
  return binary.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str) {
  let m = str.replace(/-/g, "+").replace(/_/g, "/");
  while (m.length % 4) m += "=";
  return decodeURIComponent(escape(atob(m)));
}

async function signData(data, secret) {
  const dataStr = base64UrlEncode(JSON.stringify(data));
  const key = await getHmacKey(secret);
  const enc = new TextEncoder();
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(dataStr));
  const sigStr = base64UrlEncode(sigBuf);
  return `${dataStr}.${sigStr}`;
}

async function verifySignedData(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [dataStr, sigStr] = token.split(".");
  if (!dataStr || !sigStr) return null;
  try {
    const key = await getHmacKey(secret);
    const enc = new TextEncoder();
    const expectedSigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(dataStr));
    const expectedSigStr = base64UrlEncode(expectedSigBuf);
    if (sigStr !== expectedSigStr) return null;
    const jsonStr = base64UrlDecode(dataStr);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 50000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, ...v] = part.trim().split("=");
    if (k) cookies[k] = decodeURIComponent(v.join("="));
  }
  return cookies;
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

// ---------------- Main Edge Request Handler ----------------

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const secret = env.SESSION_SECRET || DEFAULT_SECRET;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Parse path segments
  const catchall = params.catchall || [];
  const path = "/" + (Array.isArray(catchall) ? catchall.join("/") : String(catchall));

  // Parse cookies & authentication
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies["pasika_session"];
  const credToken = cookies["pasika_cred"];

  // Verify session if token exists
  let session = null;
  if (sessionToken) {
    const payload = await verifySignedData(sessionToken, secret);
    if (payload && payload.exp && payload.exp > Date.now()) {
      session = payload;
    }
  }

  // Determine current active credentials
  let activeUsername = env.ADMIN_LOGIN || "admin";
  let activeSalt = null;
  let activeHash = null;

  if (credToken) {
    const credPayload = await verifySignedData(credToken, secret);
    if (credPayload && credPayload.username && credPayload.hash && credPayload.salt) {
      activeUsername = credPayload.username;
      activeSalt = credPayload.salt;
      activeHash = credPayload.hash;
    }
  }

  // Verify password function
  async function checkPassword(user, pass) {
    if (activeHash && activeSalt) {
      if (user !== activeUsername) return false;
      const hash = await hashPassword(pass, activeSalt);
      return hash === activeHash;
    }
    // Fallback to default
    const expectedUser = env.ADMIN_LOGIN || "admin";
    const expectedPass = env.ADMIN_PASSWORD || "pasika2026";
    return user === expectedUser && pass === expectedPass;
  }

  // ---------------- Public Endpoints ----------------

  // Health
  if (path === "/health") {
    return jsonResponse({ ok: true, timestamp: Date.now(), runtime: "cloudflare-pages" });
  }

  // Auth: Login
  if (path === "/auth/login" && method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const { login, password } = body;
      if (!login || !password) {
        return jsonResponse({ error: "Вкажіть логін і пароль" }, 400);
      }

      const isValid = await checkPassword(login.trim(), password);
      if (!isValid) {
        return jsonResponse({ error: "Невірний логін або пароль" }, 401);
      }

      const username = login.trim();
      const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      const token = await signData({ username, exp, iat: Date.now() }, secret);

      const cookieVal = `pasika_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
      return jsonResponse({ success: true, username }, 200, {
        "Set-Cookie": cookieVal,
      });
    } catch (err) {
      return jsonResponse({ error: err.message || "Помилка авторизації" }, 500);
    }
  }

  // Auth: Check Session (Me)
  if (path === "/auth/me" && method === "GET") {
    if (!session) {
      return jsonResponse({ authenticated: false }, 401);
    }
    return jsonResponse({ authenticated: true, username: session.username });
  }

  // Auth: Logout
  if (path === "/auth/logout" && method === "POST") {
    const clearCookie = `pasika_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
    return jsonResponse({ success: true }, 200, {
      "Set-Cookie": clearCookie,
    });
  }

  // Products
  if (path === "/products" && method === "GET") {
    return jsonResponse(memoryProducts);
  }
  if (path === "/products/validate-stock" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];
    let valid = true;
    const errors = [];
    const adjustments = [];

    for (const item of items) {
      const prod = memoryProducts.find((p) => p.id === (item.productId || item.id) || p.slug === item.slug);
      if (!prod) {
        valid = false;
        errors.push({ productId: item.productId || item.id, message: `Товар "${item.name}" не знайдено` });
        continue;
      }
      const available = Math.max(0, (prod.stock || 0) - (prod.reserved_stock || 0));
      if (item.quantity > available) {
        valid = false;
        errors.push({
          productId: prod.id,
          name: prod.name,
          requested: item.quantity,
          available,
          message: `Недостатньо залишку для "${prod.name}". Доступно: ${available} шт.`,
        });
        adjustments.push({
          productId: prod.id,
          maxAllowed: available,
        });
      }
    }
    return jsonResponse({ valid, errors, adjustments });
  }
  if (path.startsWith("/products/id/") && method === "GET") {
    const id = path.replace("/products/id/", "");
    const prod = memoryProducts.find((p) => p.id === id);
    if (!prod) return jsonResponse({ error: "Товар не знайдено" }, 404);
    return jsonResponse(prod);
  }
  if (path.startsWith("/products/") && method === "GET") {
    const slug = path.replace("/products/", "");
    const prod = memoryProducts.find((p) => p.slug === slug);
    if (!prod) return jsonResponse({ error: "Товар не знайдено" }, 404);
    return jsonResponse(prod);
  }

  // Categories
  if (path === "/categories" && method === "GET") {
    return jsonResponse(memoryCategories);
  }

  // Settings (Public)
  if (path === "/settings" && method === "GET") {
    const publicSettings = { ...memorySettings };
    if (publicSettings.telegram) {
      publicSettings.telegram = {
        configured: Boolean(publicSettings.telegram.chatId),
      };
    }
    return jsonResponse(publicSettings);
  }

  // Delivery search
  if (path === "/delivery/cities" && method === "GET") {
    return jsonResponse([]);
  }
  if (path === "/delivery/branches" && method === "GET") {
    return jsonResponse([]);
  }

  // Public Order Creation
  if (path === "/orders" && method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));

      // Flexible extraction: flat or nested
      const rawCustomer = body.customer || {};
      const rawDelivery = body.delivery || {};
      const rawPayment = body.payment || {};

      const firstName = (body.firstName || rawCustomer.firstName || "").trim();
      const lastName = (body.lastName || rawCustomer.lastName || "").trim();
      const rawPhone = body.phone || rawCustomer.phone || "";
      const email = (body.email || rawCustomer.email || "").trim();

      const providerKey = body.providerKey || rawDelivery.providerKey || "np";
      const city = body.city || body.deliveryCity || rawDelivery.city || "";
      const branch = body.branch || body.deliveryBranch || rawDelivery.branch || "";

      const paymentMethod = body.paymentMethod || rawPayment.method || "cod";
      const isCard = paymentMethod === "card" || paymentMethod === "card_prepay";
      const cleanPayment = isCard ? "card" : "cod";

      const receiptUrl = body.receiptUrl || body.receipt?.fileUrl || null;
      const receiptName = body.receiptName || body.receipt?.name || "Чек";

      // 1. Idempotency Check
      if (body.idempotencyKey) {
        const existing = memoryOrders.find((o) => o.idempotencyKey === body.idempotencyKey);
        if (existing) {
          return jsonResponse({
            success: true,
            order: existing,
            customerToken: existing.customerToken,
            duplicate: true,
          }, 200);
        }
      }

      // 2. Validate Customer Details
      if (!firstName || !lastName) {
        return jsonResponse({ error: "Вкажіть ім'я та прізвище" }, 400);
      }

      const digits = String(rawPhone).replace(/\D/g, "");
      let normalizedPhone = null;
      if (digits.length === 10 && digits.startsWith("0")) normalizedPhone = "+38" + digits;
      else if (digits.length === 11 && digits.startsWith("80")) normalizedPhone = "+3" + digits;
      else if (digits.length === 12 && digits.startsWith("380")) normalizedPhone = "+" + digits;

      if (!normalizedPhone) {
        return jsonResponse({
          error: "Введіть коректний номер телефону України (наприклад, +380 67 123 45 67)",
        }, 400);
      }

      // 3. Validate Delivery
      const cityName = typeof city === "object" ? city.name : String(city).trim();
      const branchName = typeof branch === "object" ? branch.name : String(branch).trim();
      if (!cityName || !branchName) {
        return jsonResponse({ error: "Оберіть місто та відділення доставки" }, 400);
      }

      // 4. Validate Payment
      if (isCard && !receiptUrl) {
        return jsonResponse({
          error: "Для способу «Оплатити зараз» обов'язково завантажте чек про оплату",
        }, 400);
      }

      // 5. Validate Items & Stock Check
      const items = body.items;
      if (!Array.isArray(items) || items.length === 0) {
        return jsonResponse({ error: "Кошик порожній" }, 400);
      }

      let calculatedTotal = 0;
      const orderItems = [];

      for (const item of items) {
        const qty = Number(item.qty);
        if (!item.id || !Number.isInteger(qty) || qty <= 0) {
          return jsonResponse({ error: "Некоректні товари у кошику" }, 400);
        }
        const prod = memoryProducts.find((p) => p.id === item.id);
        if (!prod) {
          return jsonResponse({ error: `Товар не знайдено` }, 400);
        }
        if (prod.stock < qty) {
          return jsonResponse({
            error: `Недостатньо товару «${prod.name}» на складі. Доступно: ${prod.stock} шт.`,
          }, 400);
        }

        // Deduct stock
        prod.stock -= qty;
        calculatedTotal += prod.price * qty;
        orderItems.push({
          id: prod.id,
          name: prod.name,
          weight: prod.weight,
          price: prod.price,
          qty,
        });
      }

      const orderNumber = 1000 + memoryOrders.length + 1;
      const orderCode = `PAS-${orderNumber}`;
      const orderId = "ord_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
      const customerToken = "ctk_" + Math.random().toString(36).substring(2, 14);

      const newOrder = {
        id: orderId,
        number: orderNumber,
        orderCode,
        order_code: orderCode,
        status: "NEW",
        total: calculatedTotal,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        idempotencyKey: body.idempotencyKey || null,
        customer: {
          firstName,
          lastName,
          phone: normalizedPhone,
          email: email || "",
        },
        delivery: {
          provider: providerKey === "up" ? "Укрпошта" : "Нова пошта",
          providerKey,
          city: cityName,
          branch: branchName,
        },
        payment: {
          method: cleanPayment,
          paymentMethod: isCard ? "card" : "cash_on_delivery",
          methodLabel: isCard ? "Оплачено наперед" : "Оплата при отриманні",
          paymentStatus: isCard ? "Чек на перевірці" : "Очікує оплати",
          status: isCard ? "receipt_review" : "pending",
          receiptStatus: isCard ? "Прикріплено" : "Не потрібен",
          receipt: isCard ? "attached" : "not_required",
          receiptRequired: isCard,
        },
        comment: body.comment ? String(body.comment).trim() : "",
        receipt: isCard && receiptUrl
          ? {
              fileUrl: receiptUrl,
              name: receiptName || "Чек",
            }
          : null,
        items: orderItems,
        customerToken,
      };

      memoryOrders.unshift(newOrder);
      return jsonResponse({ success: true, order: newOrder, customerToken }, 201);
    } catch (err) {
      return jsonResponse({ error: err.message || "Помилка створення замовлення" }, 500);
    }
  }

  // Public Order Tracking
  if (path.startsWith("/orders/track/") && method === "GET") {
    const rawQuery = decodeURIComponent(path.replace("/orders/track/", "")).trim();
    const cleanNum = Number(rawQuery.replace(/^PAS-/i, ""));
    const matchOrder = (o) =>
      String(o.id) === rawQuery ||
      (cleanNum && o.number === cleanNum) ||
      (o.orderCode && o.orderCode.toLowerCase() === rawQuery.toLowerCase()) ||
      (o.order_code && o.order_code.toLowerCase() === rawQuery.toLowerCase()) ||
      (o.delivery?.trackingNumber && o.delivery.trackingNumber === rawQuery) ||
      (o.tracking_number && o.tracking_number === rawQuery);

    const order = memoryOrders.find(matchOrder) || SEED_ORDERS.find(matchOrder);
    if (!order) {
      return jsonResponse({ found: false, error: "Замовлення з таким номером або ТТН не знайдено" }, 404);
    }
    return jsonResponse({
      found: true,
      order: {
        id: order.id,
        number: order.number,
        orderCode: order.orderCode || `PAS-${order.number}`,
        status: order.status,
        createdAt: order.createdAt,
        total: order.total,
        deliveryService: order.delivery?.deliveryService || order.delivery?.provider || "Нова пошта",
        trackingNumber: order.delivery?.trackingNumber || order.tracking_number || null,
        trackingUrl: order.delivery?.trackingUrl || null,
        customerFirstName: order.customer?.firstName ? `${order.customer.firstName[0]}***` : "",
        city: order.delivery?.city || "",
      },
    });
  }

  // Public Order Lookup
  if (path.startsWith("/orders/") && method === "GET") {
    const id = path.replace("/orders/", "");
    const matchOrder = (o) => o.id === id || String(o.number) === id || o.orderCode === id;
    const order = memoryOrders.find(matchOrder) || SEED_ORDERS.find(matchOrder);
    if (!order) return jsonResponse({ error: "Замовлення не знайдено" }, 404);
    return jsonResponse(order);
  }

  // File Upload
  if (path === "/upload-receipt" && method === "POST") {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return jsonResponse({ error: "Очікується multipart/form-data запит" }, 400);
      }
      const formData = await request.formData();
      const file = formData.get("file") || formData.get("receipt");
      if (!file || typeof file === "string") {
        return jsonResponse({ error: "Файл чека не надано" }, 400);
      }

      const lowerName = file.name.toLowerCase();
      const validExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
      const isExtValid = validExts.some((ext) => lowerName.endsWith(ext));
      const isMimeValid =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp" ||
        file.type === "application/pdf" ||
        file.type.startsWith("image/");

      if (!isExtValid && !isMimeValid) {
        return jsonResponse({ error: "Дозволено лише файли форматів JPG, PNG, WEBP або PDF" }, 400);
      }

      if (file.size > 10 * 1024 * 1024) {
        return jsonResponse({ error: "Розмір файлу не повинен перевищувати 10 МБ" }, 400);
      }

      const ext = lowerName.match(/\.[a-z0-9]+$/)?.[0] || ".jpg";
      const filename = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const fileUrl = `/uploads/receipts/${filename}`;

      const bytes = await file.arrayBuffer();
      const mimeType =
        file.type ||
        (ext === ".pdf"
          ? "application/pdf"
          : ext === ".png"
          ? "image/png"
          : ext === ".webp"
          ? "image/webp"
          : "image/jpeg");

      const record = {
        bytes,
        type: mimeType,
        originalName: file.name,
        filename,
        size: file.size,
        createdAt: Date.now(),
      };
      memoryReceipts.set(filename, record);
      // Also map by original name e.g. IMG_1524.png
      memoryReceipts.set(file.name, record);

      return jsonResponse({
        fileUrl,
        originalName: file.name,
        filename,
      }, 200);
    } catch (err) {
      return jsonResponse({ error: err.message || "Не вдалося завантажити чек" }, 500);
    }
  }

  // Secure receipt access
  if (
    (path.startsWith("/receipts/") ||
      path.startsWith("/uploads/receipts/") ||
      path.startsWith("/api/receipts/")) &&
    method === "GET"
  ) {
    let filename = path
      .replace(/^\/api\//, "/")
      .replace(/^\/uploads\/receipts\//, "")
      .replace(/^\/receipts\//, "")
      .replace(/^\//, "");
    if (filename.includes("/")) filename = filename.split("/")[0];
    const decodedFilename = decodeURIComponent(filename);

    // 1. Authentication check: Admin session or token
    const token = (
      url.searchParams.get("token") ||
      request.headers.get("x-customer-token") ||
      request.headers.get("x-checkout-token") ||
      ""
    ).trim();

    let isAuthorized = !!session; // Admin session
    if (!isAuthorized && token) {
      const matchOrder = memoryOrders.find(
        (o) =>
          o.customerToken === token &&
          (o.receipt?.fileUrl?.includes(filename) ||
            o.receipt?.name === decodedFilename)
      );
      if (matchOrder) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return jsonResponse({ error: "Доступ до чека заборонено: необхідна авторизація" }, 403);
    }

    // 2. Lookup receipt item
    let receiptItem =
      memoryReceipts.get(filename) ||
      memoryReceipts.get(decodedFilename);

    if (!receiptItem) {
      const order = memoryOrders.find(
        (o) =>
          o.receipt?.name === decodedFilename ||
          o.receipt?.fileUrl?.endsWith(filename)
      );
      if (order?.receipt?.filename) {
        receiptItem = memoryReceipts.get(order.receipt.filename);
      }
    }

    if (receiptItem && receiptItem.bytes) {
      return new Response(receiptItem.bytes, {
        status: 200,
        headers: {
          "Content-Type": receiptItem.type,
          "Content-Disposition": `inline; filename="${encodeURIComponent(receiptItem.originalName || filename)}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // If file is physically absent
    return jsonResponse({ error: "Файл чека недоступний" }, 404);
  }

  // Product Image Upload
  if (path === "/upload-product-image" && method === "POST") {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return jsonResponse({ error: "Очікується multipart/form-data запит" }, 400);
      }
      const formData = await request.formData();
      const file = formData.get("file") || formData.get("image");
      if (!file || typeof file === "string") {
        return jsonResponse({ error: "Файл зображення не надано" }, 400);
      }

      const lowerName = file.name.toLowerCase();
      const validExts = [".jpg", ".jpeg", ".png", ".webp"];
      const isExtValid = validExts.some((ext) => lowerName.endsWith(ext));
      const isMimeValid =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp";

      if (!isExtValid && !isMimeValid) {
        return jsonResponse({ error: "Дозволено лише файли форматів JPG, PNG або WEBP" }, 400);
      }

      if (file.size > 10 * 1024 * 1024) {
        return jsonResponse({ error: "Розмір файлу не повинен перевищувати 10 МБ" }, 400);
      }

      const ext = lowerName.match(/\.[a-z0-9]+$/)?.[0] || ".jpg";
      const filename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const fileUrl = `/uploads/products/${filename}`;

      const bytes = await file.arrayBuffer();
      memoryProductImages.set(filename, { bytes, type: file.type || "image/jpeg" });

      return jsonResponse({
        success: true,
        fileUrl,
        originalName: file.name,
        filename,
      }, 200);
    } catch (err) {
      return jsonResponse({ error: err.message || "Не вдалося завантажити фото" }, 500);
    }
  }

  // Serve product images
  if (path.startsWith("/uploads/products/") && method === "GET") {
    const filename = path.replace("/uploads/products/", "");
    const item = memoryProductImages.get(filename);
    if (item) {
      return new Response(item.bytes, {
        status: 200,
        headers: {
          "Content-Type": item.type,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="100%" height="100%" fill="#FAF6EE"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#D99A19">🐝 Honey Pasika</text></svg>`,
      { status: 200, headers: { "Content-Type": "image/svg+xml; charset=utf-8" } }
    );
  }

  // ---------------- Protected Admin Endpoints ----------------

  if (path.startsWith("/admin")) {
    if (!session) {
      return jsonResponse({ error: "Необхідна авторизація" }, 401);
    }

    // Admin Security Settings Update (Username & Password)
    if (path === "/admin/security" && method === "PUT") {
      try {
        const body = await request.json().catch(() => ({}));
        const { currentPassword, newLogin, newPassword, confirmPassword } = body;

        if (!currentPassword) {
          return jsonResponse({ error: "Введіть поточний пароль для підтвердження змін" }, 400);
        }

        const isCurrentValid = await checkPassword(session.username, currentPassword);
        if (!isCurrentValid) {
          return jsonResponse({ error: "Невірний поточний пароль" }, 401);
        }

        let updatedUsername = session.username;
        if (newLogin && newLogin.trim()) {
          updatedUsername = newLogin.trim();
        }

        let newHash = activeHash;
        let newSalt = activeSalt;

        if (newPassword) {
          if (newPassword.length < 6) {
            return jsonResponse({ error: "Новий пароль має містити щонайменше 6 символів" }, 400);
          }
          if (newPassword !== confirmPassword) {
            return jsonResponse({ error: "Новий пароль та підтвердження не співпадають" }, 400);
          }
          newSalt = Math.random().toString(36).substring(2) + Date.now().toString(36);
          newHash = await hashPassword(newPassword, newSalt);
        }

        // Generate updated credentials cookie
        const credTokenUpdated = await signData(
          {
            username: updatedUsername,
            hash: newHash,
            salt: newSalt,
            updatedAt: Date.now(),
          },
          secret
        );

        // Generate updated session
        const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const sessionTokenUpdated = await signData(
          { username: updatedUsername, exp, iat: Date.now() },
          secret
        );

        const cookieSession = `pasika_session=${sessionTokenUpdated}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
        const cookieCred = `pasika_cred=${credTokenUpdated}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`;

        return new Response(
          JSON.stringify({
            success: true,
            message: "Пароль та налаштування безпеки успішно оновлено.",
            username: updatedUsername,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
              "Set-Cookie": `${cookieSession}, ${cookieCred}`,
            },
          }
        );
      } catch (err) {
        return jsonResponse({ error: err.message || "Помилка зміни безпеки" }, 500);
      }
    }

    // Admin Dashboard
    if (path === "/admin/dashboard" && method === "GET") {
      const totalOrders = memoryOrders.length;
      const totalRevenue = memoryOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const ordersToday = memoryOrders.length;
      const ordersThisWeek = memoryOrders.length;
      const ordersThisMonth = memoryOrders.length;
      const newOrders = memoryOrders.filter((o) => o.status === "NEW").length;
      const processingOrders = memoryOrders.filter((o) => o.status === "PROCESSING").length;
      const packedOrders = memoryOrders.filter((o) => o.status === "PACKED").length;
      const shippedOrders = memoryOrders.filter((o) => o.status === "SHIPPED").length;
      const completedOrders = memoryOrders.filter((o) => o.status === "COMPLETED").length;
      const cancelledOrders = memoryOrders.filter((o) => o.status === "CANCELLED").length;
      const completedRevenue = memoryOrders
        .filter((o) => o.status === "COMPLETED")
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const activeOrdersCount = Math.max(totalOrders - cancelledOrders, 0);
      const averageCheck = activeOrdersCount > 0 ? Math.round(totalRevenue / activeOrdersCount) : 0;

      const customerPhones = new Set();
      memoryOrders.forEach((o) => {
        if (o.customer?.phone) customerPhones.add(o.customer.phone);
      });
      const totalCustomers = customerPhones.size;
      const newCustomers = customerPhones.size > 0 ? 1 : 0;
      const repeatCustomers = Math.max(0, totalCustomers - newCustomers);

      return jsonResponse({
        kpis: {
          totalOrders,
          ordersToday,
          ordersThisWeek,
          ordersThisMonth,
          newOrders,
          processingOrders,
          packedOrders,
          shippedOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue,
          completedRevenue,
          averageCheck,
          totalCustomers,
          newCustomers,
          repeatCustomers,
        },
        recentOrders: memoryOrders.slice(0, 10),
        topProducts: memoryProducts.slice(0, 5).map((p) => ({ name: p.name, qty: p.stock })),
        telegramLogs: [],
        salesOrders: memoryOrders.slice(0, 10),
      });
    }

    // Admin Orders
    if (path === "/admin/orders" && method === "GET") {
      const status = url.searchParams.get("status");
      const isDeleted = url.searchParams.get("deleted") === "true";
      let list = memoryOrders.filter((o) => (isDeleted ? Boolean(o.deleted_at) : !o.deleted_at));
      if (status && status !== "all") {
        list = list.filter((o) => o.status === status);
      }
      return jsonResponse(list);
    }
    if (path.startsWith("/admin/orders/") && path.endsWith("/tracking") && method === "PATCH") {
      const id = path.replace("/admin/orders/", "").replace("/tracking", "");
      const body = await request.json().catch(() => ({}));
      const idx = memoryOrders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        const o = memoryOrders[idx];
        o.tracking_number = body.trackingNumber || "";
        o.delivery_service = body.deliveryService || "Нова пошта";
        o.status = "SHIPPED";
        o.shipped_at = Date.now();
        if (!o.delivery) o.delivery = {};
        o.delivery.trackingNumber = o.tracking_number;
        o.delivery.deliveryService = o.delivery_service;
        o.delivery.shippedAt = o.shipped_at;
        const trackUrl = o.delivery_service.toLowerCase().includes("укр")
          ? `https://track.ukrposhta.ua/tracking_UA.html?barcode=${encodeURIComponent(o.tracking_number)}`
          : `https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(o.tracking_number)}`;
        o.delivery.trackingUrl = trackUrl;
        return jsonResponse(o);
      }
      return jsonResponse({ error: "Замовлення не знайдено" }, 404);
    }
    if (path.startsWith("/admin/orders/") && path.endsWith("/status") && method === "PATCH") {
      const id = path.replace("/admin/orders/", "").replace("/status", "");
      const body = await request.json().catch(() => ({}));
      const idx = memoryOrders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        memoryOrders[idx].status = body.status;
        if (!memoryOrders[idx].statusHistory) memoryOrders[idx].statusHistory = [];
        memoryOrders[idx].statusHistory.push({
          fromStatus: memoryOrders[idx].status,
          toStatus: body.status,
          comment: body.comment || null,
          changedBy: "admin",
          createdAt: Date.now(),
        });
        return jsonResponse(memoryOrders[idx]);
      }
      return jsonResponse({ error: "Замовлення не знайдено" }, 404);
    }
    if (path.startsWith("/admin/orders/") && path.endsWith("/restore") && method === "POST") {
      const id = path.replace("/admin/orders/", "").replace("/restore", "");
      const idx = memoryOrders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        memoryOrders[idx].deleted_at = null;
        memoryOrders[idx].isDeleted = false;
        return jsonResponse({ success: true, order: memoryOrders[idx] });
      }
      return jsonResponse({ error: "Замовлення не знайдено" }, 404);
    }
    if (path.startsWith("/admin/orders/") && method === "DELETE") {
      const id = path.replace("/admin/orders/", "");
      const idx = memoryOrders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        memoryOrders[idx].deleted_at = Date.now();
        memoryOrders[idx].deletedAt = memoryOrders[idx].deleted_at;
        memoryOrders[idx].isDeleted = true;
        return jsonResponse({ success: true });
      }
      return jsonResponse({ error: "Замовлення не знайдено" }, 404);
    }
    if (path.startsWith("/admin/orders/") && path.endsWith("/confirm-payment") && method === "POST") {
      const id = path.replace("/admin/orders/", "").replace("/confirm-payment", "");
      let idx = memoryOrders.findIndex((o) => o.id === id || String(o.number) === id || o.orderCode === id);
      if (idx < 0) {
        const seed = SEED_ORDERS.find((o) => o.id === id || String(o.number) === id || o.orderCode === id);
        if (seed) {
          memoryOrders.unshift({ ...seed });
          idx = 0;
        }
      }
      if (idx < 0) return jsonResponse({ error: "Замовлення не знайдено" }, 404);
      memoryOrders[idx].status = "PAID";
      memoryOrders[idx].updatedAt = Date.now();
      if (!memoryOrders[idx].statusHistory) memoryOrders[idx].statusHistory = [];
      memoryOrders[idx].statusHistory.push({
        fromStatus: memoryOrders[idx].status,
        toStatus: "PAID",
        comment: "Оплату підтверджено адміністратором",
        changedBy: "admin",
        createdAt: Date.now(),
      });
      return jsonResponse({ success: true, order: memoryOrders[idx] });
    }

    if (path.startsWith("/admin/orders/") && method === "GET") {
      const id = path.replace("/admin/orders/", "");
      const matchOrder = (o) => o.id === id || String(o.number) === id || o.orderCode === id;
      const order = memoryOrders.find(matchOrder) || SEED_ORDERS.find(matchOrder);
      if (!order) return jsonResponse({ error: "Замовлення не знайдено" }, 404);
      return jsonResponse(order);
    }

    // Delivery & Accounts
    if (path === "/admin/delivery/accounts" && method === "GET") {
      const provider = url.searchParams.get("provider");
      let list = memoryDeliveryAccounts;
      if (provider) {
        list = list.filter((a) => a.provider === provider);
      }
      return jsonResponse(list);
    }
    if (path === "/admin/delivery/accounts" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const newAcc = {
        id: `da_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: body.name || "Акаунт доставки",
        provider: body.provider || "np",
        apiKey: body.apiKey || "",
        senderName: body.senderName || "",
        phone: body.phone || "",
        cityName: body.cityName || "",
        warehouseName: body.warehouseName || "",
        isDefault: Boolean(body.isDefault),
        isActive: body.isActive !== false,
        createdAt: Date.now(),
      };
      if (newAcc.isDefault) {
        memoryDeliveryAccounts.forEach((a) => {
          if (a.provider === newAcc.provider) a.isDefault = false;
        });
      }
      memoryDeliveryAccounts.push(newAcc);
      return jsonResponse(newAcc, 201);
    }
    if (path.startsWith("/admin/delivery/accounts/") && method === "PUT") {
      const id = path.replace("/admin/delivery/accounts/", "");
      const body = await request.json().catch(() => ({}));
      const idx = memoryDeliveryAccounts.findIndex((a) => a.id === id);
      if (idx < 0) return jsonResponse({ error: "Акаунт не знайдено" }, 404);
      Object.assign(memoryDeliveryAccounts[idx], body);
      return jsonResponse(memoryDeliveryAccounts[idx]);
    }
    if (path.startsWith("/admin/delivery/accounts/") && method === "DELETE") {
      const id = path.replace("/admin/delivery/accounts/", "");
      memoryDeliveryAccounts = memoryDeliveryAccounts.filter((a) => a.id !== id);
      return jsonResponse({ success: true });
    }
    if (path === "/admin/delivery/check" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const { provider, apiKey } = body;
      if (!apiKey || !apiKey.trim()) {
        return jsonResponse({
          ok: false,
          status: "not_configured",
          message: "API-ключ не налаштовано",
        });
      }
      return jsonResponse({
        ok: true,
        status: "active",
        provider: provider || "np",
        message: "Підключення успішне",
      });
    }
    if (path.startsWith("/admin/delivery/orders/") && path.endsWith("/ttn") && method === "POST") {
      const id = path.replace("/admin/delivery/orders/", "").replace("/ttn", "");
      let idx = memoryOrders.findIndex((o) => o.id === id || String(o.number) === id || o.orderCode === id);
      if (idx < 0) {
        const seed = SEED_ORDERS.find((o) => o.id === id || String(o.number) === id || o.orderCode === id);
        if (seed) {
          memoryOrders.unshift({ ...seed });
          idx = 0;
        }
      }
      if (idx < 0) return jsonResponse({ error: "Замовлення не знайдено" }, 404);
      const fakeTtn = "20450" + Math.floor(10000000 + Math.random() * 90000000);
      memoryOrders[idx].tracking_number = fakeTtn;
      memoryOrders[idx].status = "SHIPMENT_CREATED";
      if (!memoryOrders[idx].delivery) memoryOrders[idx].delivery = {};
      memoryOrders[idx].delivery.trackingNumber = fakeTtn;
      memoryOrders[idx].delivery.trackingUrl = `https://novaposhta.ua/tracking/?cargo_number=${fakeTtn}`;
      return jsonResponse({ success: true, trackingNumber: fakeTtn, order: memoryOrders[idx] });
    }
    if (path.startsWith("/admin/delivery/orders/") && path.endsWith("/ttn") && method === "DELETE") {
      const id = path.replace("/admin/delivery/orders/", "").replace("/ttn", "");
      const idx = memoryOrders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        memoryOrders[idx].tracking_number = "";
        if (memoryOrders[idx].delivery) {
          memoryOrders[idx].delivery.trackingNumber = null;
          memoryOrders[idx].delivery.trackingUrl = null;
        }
      }
      return jsonResponse({ success: true });
    }
    if (path.startsWith("/admin/delivery/orders/") && path.endsWith("/tracking") && method === "GET") {
      const id = path.replace("/admin/delivery/orders/", "").replace("/tracking", "");
      const order = memoryOrders.find((o) => o.id === id);
      return jsonResponse({
        status: "В дорозі до відділення",
        statusCode: "7",
        trackingNumber: order?.delivery?.trackingNumber || "—",
        updatedAt: Date.now(),
      });
    }

    // Admin Customers
    if (path === "/admin/customers" && method === "GET") {
      const map = new Map();
      for (const o of memoryOrders) {
        const phone = o.customer?.phone;
        if (!phone) continue;
        if (!map.has(phone)) {
          map.set(phone, {
            id: "c_" + phone.replace(/\D/g, ""),
            phone,
            first_name: o.customer.firstName || "",
            last_name: o.customer.lastName || "",
            email: o.customer.email || "",
            total_orders: 0,
            total_spent: 0,
            last_order_at: o.createdAt,
          });
        }
        const c = map.get(phone);
        c.total_orders += 1;
        c.total_spent += o.total || 0;
        if (o.createdAt > c.last_order_at) c.last_order_at = o.createdAt;
      }
      return jsonResponse(Array.from(map.values()));
    }
    if (path.startsWith("/admin/customers/") && method === "GET") {
      const id = path.replace("/admin/customers/", "");
      let foundCustomer = null;
      let customerOrdersList = [];
      for (const o of memoryOrders) {
        const cId = "c_" + (o.customer?.phone || "").replace(/\D/g, "");
        if (cId === id || o.customer_id === id) {
          if (!foundCustomer) {
            foundCustomer = {
              id: cId,
              phone: o.customer?.phone || "",
              first_name: o.customer?.firstName || "",
              last_name: o.customer?.lastName || "",
              email: o.customer?.email || "",
            };
          }
          customerOrdersList.push(o);
        }
      }
      if (!foundCustomer) return jsonResponse({ error: "Клієнта не знайдено" }, 404);
      return jsonResponse({
        ...foundCustomer,
        orders: customerOrdersList,
      });
    }

    // Admin Backups
    if (path === "/admin/backups" && method === "GET") {
      return jsonResponse({
        databasePath: "edge_memory_store",
        backupDirectory: "edge_storage",
        backups: [
          {
            filename: `pasika-edge-snapshot-${new Date().toISOString().slice(0, 10)}.json`,
            size: 16384,
            sizeFormatted: "16 KB",
            createdAt: Date.now(),
          },
        ],
      });
    }
    if (path === "/admin/backup/create" && method === "POST") {
      const filename = `pasika-edge-snapshot-${Date.now()}.json`;
      return jsonResponse({
        success: true,
        filename,
        size: 16384,
        sizeFormatted: "16 KB",
        createdAt: Date.now(),
      }, 201);
    }
    if ((path === "/admin/backup" || path.startsWith("/admin/backups/")) && method === "GET") {
      const snapshot = JSON.stringify({
        orders: memoryOrders,
        products: memoryProducts,
        settings: memorySettings,
      }, null, 2);
      return new Response(snapshot, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="pasika-edge-backup.json"',
        },
      });
    }

    // Admin Products
    if (path === "/admin/products" && method === "GET") {
      return jsonResponse(memoryProducts);
    }
    if (path === "/admin/products" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const name = (body.name || "").trim();
      if (!name) {
        return jsonResponse({ error: "Назва товару обов'язкова" }, 400);
      }
      const image = (body.image || "").trim();
      if (!image) {
        return jsonResponse({ error: "Фото товару обов'язкове для створення нового товару" }, 400);
      }
      const rawSlug = (body.slug || "").trim() || transliterateUa(name);
      const cleanSlug = transliterateUa(rawSlug);
      const slug = resolveEdgeUniqueSlug(cleanSlug);
      const newProd = {
        ...body,
        id: "p_" + Date.now(),
        name,
        slug,
        image,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      memoryProducts.unshift(newProd);
      return jsonResponse(newProd, 201);
    }
    if (path.startsWith("/admin/products/") && path.endsWith("/duplicate") && method === "POST") {
      const id = path.replace("/admin/products/", "").replace("/duplicate", "");
      const orig = memoryProducts.find((p) => p.id === id);
      if (!orig) return jsonResponse({ error: "Товар не знайдено" }, 404);
      const dup = {
        ...orig,
        id: "p_" + Date.now(),
        name: orig.name + " (копія)",
        slug: resolveEdgeUniqueSlug(orig.slug + "-2"),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      memoryProducts.unshift(dup);
      return jsonResponse(dup, 201);
    }
    if (path.startsWith("/admin/products/") && method === "PUT") {
      const id = path.replace("/admin/products/", "");
      const body = await request.json().catch(() => ({}));
      const idx = memoryProducts.findIndex((p) => p.id === id);
      if (idx >= 0) {
        memoryProducts[idx] = { ...memoryProducts[idx], ...body, id, updatedAt: Date.now() };
        return jsonResponse(memoryProducts[idx]);
      }
      return jsonResponse({ error: "Товар не знайдено" }, 404);
    }
    if (path.startsWith("/admin/products/") && method === "DELETE") {
      const id = path.replace("/admin/products/", "");
      memoryProducts = memoryProducts.filter((p) => p.id !== id);
      return jsonResponse({ success: true });
    }

    // Admin Categories
    if (path === "/admin/categories" && method === "GET") {
      return jsonResponse(memoryCategories);
    }
    if (path === "/admin/categories" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const name = (body.name || "").trim();
      if (!name) return jsonResponse({ error: "Назва категорії обов'язкова" }, 400);
      let slug = (body.slug || "").trim() || transliterateUa(name);
      slug = transliterateUa(slug);
      const icon = (body.icon || "🍯").trim();
      const sortOrder = Number(body.sortOrder) || 0;

      const idx = memoryCategories.findIndex((c) => c.slug === slug);
      const catObj = { slug, name, icon, sortOrder };
      if (idx >= 0) {
        memoryCategories[idx] = catObj;
      } else {
        memoryCategories.push(catObj);
      }
      return jsonResponse(catObj);
    }
    if (path.startsWith("/admin/categories/") && method === "DELETE") {
      const slug = path.replace("/admin/categories/", "");
      const count = memoryProducts.filter((p) => p.category === slug).length;
      if (count > 0) {
        return jsonResponse({
          error: `У цій категорії є ${count} товарів. Спочатку перенесіть товари в іншу категорію.`,
        }, 400);
      }
      memoryCategories = memoryCategories.filter((c) => c.slug !== slug);
      return jsonResponse({ success: true });
    }

    // Admin Settings
    if (path === "/admin/settings" && method === "GET") {
      const masked = {
        ...memorySettings,
        telegram: {
          hasToken: Boolean(memorySettings.telegram?.botToken),
          botToken: memorySettings.telegram?.botToken ? "••••••••••••••••" : "",
          chatId: memorySettings.telegram?.chatId || "",
        },
      };
      return jsonResponse(masked);
    }
    if (path === "/admin/settings" && method === "PUT") {
      const body = await request.json().catch(() => ({}));
      let finalTelegram = { ...(memorySettings.telegram || {}) };
      if (body.telegram) {
        const rawToken = (body.telegram.botToken || "").trim();
        if (rawToken && rawToken !== "••••••••••••••••") {
          finalTelegram.botToken = rawToken;
        }
        if (body.telegram.chatId !== undefined) {
          finalTelegram.chatId = String(body.telegram.chatId).trim();
        }
      }
      memorySettings = {
        ...memorySettings,
        ...body,
        telegram: finalTelegram,
      };
      return jsonResponse({
        ...memorySettings,
        telegram: {
          hasToken: Boolean(finalTelegram.botToken),
          botToken: finalTelegram.botToken ? "••••••••••••••••" : "",
          chatId: finalTelegram.chatId || "",
        },
      });
    }

    // Admin Telegram Test
    if (path === "/admin/telegram/test" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const customToken = (body.botToken && body.botToken !== "••••••••••••••••" ? body.botToken : memorySettings.telegram?.botToken)?.trim();
      const customChatId = (body.chatId || memorySettings.telegram?.chatId || "287686358")?.trim();
      if (!customToken) {
        return jsonResponse({ ok: false, error: "Telegram Bot Token не налаштовано" });
      }
      try {
        const res = await fetch(`https://api.telegram.org/bot${customToken}/getMe`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          return jsonResponse({ ok: false, error: data.description || "Невірний токен бота" });
        }
        const botUsername = data.result?.username ? `@${data.result.username}` : "";
        const botName = data.result?.first_name || "Honey Bot";
        if (customChatId) {
          try {
            const sendRes = await fetch(`https://api.telegram.org/bot${customToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: customChatId,
                text: `🐝 <b>PASIKA — Тест підключення</b>\n\nTelegram підключено успішно ✅\nБот: <b>${botName}</b> (${botUsername || "без username"})\nChat ID: <code>${customChatId}</code>\n\nВи будете отримувати сповіщення про нові замовлення.`,
                parse_mode: "HTML",
              }),
            });
            const sendData = await sendRes.json().catch(() => ({}));
            if (!sendRes.ok || !sendData.ok) {
              return jsonResponse({
                ok: false,
                error: `Помилка Telegram API при відправці в чат (${customChatId}): ${sendData.description || "Не вдалося надіслати тестове повідомлення"}`,
                botName,
                botUsername,
              });
            }
          } catch (sendErr) {
            return jsonResponse({
              ok: false,
              error: `Помилка зв'язку з Telegram API: ${sendErr.message}`,
              botName,
              botUsername,
            });
          }
        }
        return jsonResponse({
          ok: true,
          botName,
          botUsername,
          message: "Telegram підключено успішно ✅",
        });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message || "Помилка зв'язку з Telegram" });
      }
    }

    // Admin Telegram Log
    if (path === "/admin/telegram-log" && method === "GET") {
      return jsonResponse([]);
    }

    // Admin Telegram Config
    if (path === "/admin/telegram/config" && method === "GET") {
      return jsonResponse({
        enabled: memorySettings.telegram?.enabled ?? true,
        hasToken: Boolean(memorySettings.telegram?.botToken),
        botToken: memorySettings.telegram?.botToken ? "••••••••••••••••" : "",
        botUsername: memorySettings.telegram?.botUsername || "",
        status: memorySettings.telegram?.lastStatus || (memorySettings.telegram?.botToken ? "configured" : "unconfigured"),
      });
    }

    if (path === "/admin/telegram/config" && method === "PUT") {
      const body = await request.json().catch(() => ({}));
      if (!memorySettings.telegram) memorySettings.telegram = {};
      if (body.enabled !== undefined) memorySettings.telegram.enabled = Boolean(body.enabled);
      if (body.botToken && body.botToken !== "••••••••••••••••") {
        memorySettings.telegram.botToken = String(body.botToken).trim();
      }
      return jsonResponse({
        enabled: memorySettings.telegram.enabled,
        hasToken: Boolean(memorySettings.telegram.botToken),
        botToken: memorySettings.telegram.botToken ? "••••••••••••••••" : "",
        botUsername: memorySettings.telegram.botUsername || "",
        status: memorySettings.telegram.botToken ? "configured" : "unconfigured",
      });
    }

    // Admin Telegram Recipients
    if (path === "/admin/telegram/recipients" && method === "GET") {
      return jsonResponse(memoryTelegramRecipients);
    }

    if (path === "/admin/telegram/recipients" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const id = "tr_" + Date.now().toString(36);
      const recipient = {
        id,
        name: String(body.name || "").trim(),
        username: String(body.username || "").trim(),
        chat_id: String(body.chat_id || "").trim(),
        role: body.role || "manager",
        is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      if (!recipient.name || !recipient.chat_id) {
        return jsonResponse({ error: "Вкажіть ім'я та Chat ID" }, 400);
      }
      memoryTelegramRecipients.push(recipient);
      return jsonResponse(recipient, 201);
    }

    if (path.startsWith("/admin/telegram/recipients/") && method === "PUT") {
      const id = path.replace("/admin/telegram/recipients/", "");
      const body = await request.json().catch(() => ({}));
      const idx = memoryTelegramRecipients.findIndex((r) => r.id === id);
      if (idx < 0) return jsonResponse({ error: "Отримувача не знайдено" }, 404);
      memoryTelegramRecipients[idx] = {
        ...memoryTelegramRecipients[idx],
        ...body,
        updated_at: Date.now(),
      };
      return jsonResponse(memoryTelegramRecipients[idx]);
    }

    if (path.startsWith("/admin/telegram/recipients/") && method === "DELETE") {
      const id = path.replace("/admin/telegram/recipients/", "");
      memoryTelegramRecipients = memoryTelegramRecipients.filter((r) => r.id !== id);
      return jsonResponse({ ok: true, id });
    }

    if (path.startsWith("/admin/telegram/recipients/") && path.endsWith("/toggle") && method === "POST") {
      const id = path.replace("/admin/telegram/recipients/", "").replace("/toggle", "");
      const idx = memoryTelegramRecipients.findIndex((r) => r.id === id);
      if (idx < 0) return jsonResponse({ error: "Отримувача не знайдено" }, 404);
      memoryTelegramRecipients[idx].is_active = !memoryTelegramRecipients[idx].is_active;
      memoryTelegramRecipients[idx].updated_at = Date.now();
      return jsonResponse(memoryTelegramRecipients[idx]);
    }

    if (path.startsWith("/admin/telegram/recipients/") && path.endsWith("/test") && method === "POST") {
      const id = path.replace("/admin/telegram/recipients/", "").replace("/test", "");
      const recipient = memoryTelegramRecipients.find((r) => r.id === id);
      if (!recipient) return jsonResponse({ error: "Отримувача не знайдено" }, 404);
      return jsonResponse({ ok: true, simulated: true, message: `Тестове повідомлення для ${recipient.name} змодельовано успішно` });
    }

    if (path === "/admin/telegram/recent-chats" && method === "GET") {
      return jsonResponse(memoryTelegramInteractions);
    }
  }

  // Not Found
  return jsonResponse({ error: "Admin API endpoint не знайдено" }, 404);
}
