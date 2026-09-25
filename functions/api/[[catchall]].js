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

// In-memory cache for edge runtime worker lifetime
let memoryOrders = [];
let memorySettings = { ...DEFAULT_SETTINGS };
let memoryProducts = [...SEED_PRODUCTS];
let memoryCategories = [...SEED_CATEGORIES];
let memoryTelegramRecipients = [];
let memoryTelegramInteractions = [];
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
      const orderId = "ord_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
      const customerToken = "ctk_" + Math.random().toString(36).substring(2, 14);

      const newOrder = {
        id: orderId,
        number: orderNumber,
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

  // Public Order Lookup
  if (path.startsWith("/orders/") && method === "GET") {
    const id = path.replace("/orders/", "");
    const order = memoryOrders.find((o) => o.id === id);
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
      const totalRevenue = memoryOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const ordersToday = memoryOrders.length;
      const newOrders = memoryOrders.filter((o) => o.status === "NEW").length;
      const processingOrders = memoryOrders.filter((o) => o.status === "PROCESSING").length;
      const completedOrders = memoryOrders.filter((o) => o.status === "COMPLETED").length;

      return jsonResponse({
        kpis: {
          ordersToday,
          newOrders,
          processingOrders,
          completedOrders,
          totalRevenue,
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
      const list = status && status !== "all"
        ? memoryOrders.filter((o) => o.status === status)
        : memoryOrders;
      return jsonResponse(list);
    }
    if (path.startsWith("/admin/orders/") && path.endsWith("/status") && method === "PATCH") {
      const id = path.replace("/admin/orders/", "").replace("/status", "");
      const body = await request.json().catch(() => ({}));
      const idx = memoryOrders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        memoryOrders[idx].status = body.status;
        return jsonResponse(memoryOrders[idx]);
      }
      return jsonResponse({ error: "Замовлення не знайдено" }, 404);
    }
    if (path.startsWith("/admin/orders/") && method === "GET") {
      const id = path.replace("/admin/orders/", "");
      const order = memoryOrders.find((o) => o.id === id);
      if (!order) return jsonResponse({ error: "Замовлення не знайдено" }, 404);
      return jsonResponse(order);
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
      const customChatId = (body.chatId || memorySettings.telegram?.chatId)?.trim();
      if (!customToken) {
        return jsonResponse({ ok: false, error: "Telegram Bot Token не налаштовано" });
      }
      try {
        const res = await fetch(`https://api.telegram.org/bot${customToken}/getMe`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return jsonResponse({ ok: false, error: data.description || "Невірний токен бота" });
        }
        const botName = data.result?.username ? `@${data.result.username}` : data.result?.first_name || "Bot";
        if (customChatId) {
          try {
            await fetch(`https://api.telegram.org/bot${customToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: customChatId,
                text: "🐝 Honey Pasika: тестове сповіщення успішно надіслано!",
              }),
            });
          } catch {}
        }
        return jsonResponse({
          ok: true,
          botName,
          message: `З'єднання успішне! Бот: ${botName}${customChatId ? " (тестове повідомлення надіслано в чат)" : ""}`,
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
