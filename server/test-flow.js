import assert from "node:assert";
import http from "node:http";

// Set test environment
process.env.NODE_ENV = "test";
process.env.DB_PATH = ":memory:"; // use isolated in-memory SQLite database
process.env.ADMIN_LOGIN = "testadmin";
process.env.ADMIN_PASSWORD = "testpassword123";

const { app } = await import("./index.js");
const { db } = await import("./db.js");

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const BASE_URL = `http://127.0.0.1:${port}`;

console.log(`🧪 Running updated backend test-flow against ${BASE_URL}...`);

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, headers: res.headers, data };
}

async function apiBytes(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { status: res.status, ok: res.ok, headers: res.headers, buffer };
}

try {
  // ---------------- TEST 1: CATALOG & PRODUCTS ----------------
  console.log("➡️ Test 1: Categories & Products API");
  const catRes = await api("/api/categories");
  assert.strictEqual(catRes.status, 200);
  assert.ok(catRes.data.length >= 7, "Should have seeded categories");

  const prodRes = await api("/api/products");
  assert.strictEqual(prodRes.status, 200);
  const p1 = prodRes.data.find((p) => p.id === "p1");
  const p3 = prodRes.data.find((p) => p.id === "p3");
  assert.ok(p1, "Product p1 must exist");
  assert.ok(p3, "Product p3 must exist");

  const initialP1Stock = p1.stock;
  const initialP3Stock = p3.stock;
  assert.strictEqual(typeof initialP1Stock, "number");
  assert.strictEqual(typeof initialP3Stock, "number");

  // ---------------- TEST 2: DELIVERY API ----------------
  console.log("➡️ Test 2: Server-side Delivery API (NP & UP)");
  const npCities = await api("/api/delivery/cities?provider=np&query=Київ");
  assert.strictEqual(npCities.status, 200);
  assert.ok(npCities.data.length > 0);
  const npCity = npCities.data[0];
  assert.ok(npCity.id && npCity.name, "City must contain real ID and name");

  const npBranches = await api(`/api/delivery/branches?provider=np&cityId=${npCity.id}`);
  assert.strictEqual(npBranches.status, 200);
  assert.ok(npBranches.data.length > 0);
  const npBranch = npBranches.data[0];
  assert.ok(npBranch.id && npBranch.name, "Branch must contain real ID and name");

  // ---------------- TEST 3: RECEIPT UPLOAD & SECURE ACCESS ----------------
  console.log("➡️ Test 3: Receipt Upload, Validation & Secure Access");
  const checkoutToken = "checkout_session_" + Date.now();
  const testReceiptContent = Buffer.from("%PDF-1.4\nExact byte-for-byte payment receipt verification test\n%%EOF");
  const boundary = "----WebKitFormBoundaryE2ETest7788";

  // 3a. Upload without checkoutToken must fail (400)
  const noTokenBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="check.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    testReceiptContent,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const noTokenRes = await api("/api/upload-receipt", {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: noTokenBody,
  });
  assert.strictEqual(noTokenRes.status, 400, "Upload without checkoutToken must fail with 400");

  // 3b. Upload with valid checkoutToken must succeed
  const validMultipartBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="checkoutToken"\r\n\r\n${checkoutToken}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="check.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    testReceiptContent,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const uploadRes = await api("/api/upload-receipt", {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: validMultipartBody,
  });
  assert.strictEqual(uploadRes.status, 200, "Upload with checkoutToken must return 200");
  const uploadedReceiptUrl = uploadRes.data.fileUrl;
  assert.ok(uploadedReceiptUrl.startsWith("/uploads/receipts/"));

  // 3c. Public unauthenticated request to receipt file without token must be blocked (403)
  const unauthReceiptRes = await api(uploadedReceiptUrl);
  assert.strictEqual(unauthReceiptRes.status, 403, "Public access to receipt without token must return 403");

  // 3d. Request with valid checkoutToken must succeed, byte comparison must match exactly!
  const receiptWithTokenRes = await apiBytes(`${uploadedReceiptUrl}?token=${checkoutToken}`);
  assert.strictEqual(receiptWithTokenRes.status, 200, "Access with checkoutToken must return 200");
  assert.strictEqual(
    Buffer.compare(receiptWithTokenRes.buffer, testReceiptContent),
    0,
    "Downloaded receipt bytes must match uploaded receipt exactly (byte-for-byte)"
  );

  // ---------------- TEST 4: ORDER CREATION (p1 × 2, p3 × 1) ----------------
  console.log("➡️ Test 4: Order Creation, Stock Deductions (p1 × 2, p3 × 1) & Validation");

  // 4a. Invalid phone
  const badPhoneRes = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Іван",
      lastName: "Франко",
      phone: "invalid-phone",
      items: [{ id: "p1", qty: 2 }],
      delivery: { providerKey: "np", city: npCity, branch: npBranch },
      paymentMethod: "cod",
    }),
  });
  assert.strictEqual(badPhoneRes.status, 400);

  // 4b. Out-of-stock check
  const overStockRes = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Іван",
      lastName: "Франко",
      phone: "+380671234567",
      items: [{ id: "p1", qty: initialP1Stock + 999 }],
      delivery: { providerKey: "np", city: npCity, branch: npBranch },
      paymentMethod: "cod",
    }),
  });
  assert.strictEqual(overStockRes.status, 400);

  // 4c. Valid Order Creation with p1 × 2 and p3 × 1
  const idempotencyKey = "test_idem_" + Date.now();
  const orderRes = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Оксана",
      lastName: "Забужко",
      phone: "+380 50 999 88 77",
      email: "oksana@example.com",
      providerKey: "np",
      city: npCity,
      branch: npBranch,
      paymentMethod: "card",
      receiptUrl: uploadedReceiptUrl,
      receiptName: "check.pdf",
      checkoutToken,
      comment: "Будь ласка, зателефонуйте перед відправкою",
      items: [
        { id: "p1", qty: 2 },
        { id: "p3", qty: 1 },
      ],
      idempotencyKey,
    }),
  });

  assert.strictEqual(orderRes.status, 201, "Order creation should return 201");
  const createdOrder = orderRes.data.order;
  const customerToken = orderRes.data.customerToken;
  assert.ok(createdOrder.id, "Order must have an ID");
  assert.ok(customerToken, "Order response must include customerToken");
  assert.strictEqual(createdOrder.number >= 1027, true);
  assert.strictEqual(createdOrder.total, p1.price * 2 + p3.price * 1);
  assert.strictEqual(createdOrder.delivery.cityId, npCity.id);
  assert.strictEqual(createdOrder.delivery.branchId, npBranch.id);

  // 4d. Verify stock deductions: p1 by 2, p3 by 1
  const p1After = db.prepare("SELECT stock FROM products WHERE id = 'p1'").get();
  const p3After = db.prepare("SELECT stock FROM products WHERE id = 'p3'").get();
  assert.strictEqual(p1After.stock, initialP1Stock - 2, "Stock of p1 must be reduced by 2");
  assert.strictEqual(p3After.stock, initialP3Stock - 1, "Stock of p3 must be reduced by 1");

  // 4e. Idempotency test (repeat submit protection)
  const duplicateRes = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Оксана",
      lastName: "Забужко",
      phone: "+380 50 999 88 77",
      items: [
        { id: "p1", qty: 2 },
        { id: "p3", qty: 1 },
      ],
      idempotencyKey,
    }),
  });
  assert.strictEqual(duplicateRes.status, 200);
  assert.strictEqual(duplicateRes.data.order.id, createdOrder.id);
  assert.strictEqual(duplicateRes.data.duplicate, true);
  const p1AfterDup = db.prepare("SELECT stock FROM products WHERE id = 'p1'").get();
  assert.strictEqual(p1AfterDup.stock, initialP1Stock - 2, "Stock must NOT be deducted again on duplicate");

  // ---------------- TEST 5: ORDER PRIVACY & CUSTOMER TOKEN ----------------
  console.log("➡️ Test 5: Order Privacy & One-time Customer Token Protection");

  // 5a. GET /api/orders/:id WITHOUT token must return 403 Forbidden
  const noTokenOrderRes = await api(`/api/orders/${createdOrder.id}`);
  assert.strictEqual(noTokenOrderRes.status, 403, "Public access to order without customer token must return 403");

  // 5b. GET /api/orders/:id with invalid token must return 403 Forbidden
  const badTokenOrderRes = await api(`/api/orders/${createdOrder.id}?token=invalid_token_12345`);
  assert.strictEqual(badTokenOrderRes.status, 403, "Access with wrong customer token must return 403");

  // 5c. GET /api/orders/:id WITH valid customer token must return 200 with full details
  const validTokenOrderRes = await api(`/api/orders/${createdOrder.id}?token=${customerToken}`);
  assert.strictEqual(validTokenOrderRes.status, 200, "Access with valid customer token must return 200");
  assert.strictEqual(validTokenOrderRes.data.customer.firstName, "Оксана");
  assert.strictEqual(validTokenOrderRes.data.customer.phone, "+380509998877");
  assert.ok(validTokenOrderRes.data.receipt.fileUrl.includes(`token=${customerToken}`));

  // 5d. Customer can access their receipt via receipt link with customer token
  const customerReceiptRes = await apiBytes(validTokenOrderRes.data.receipt.fileUrl);
  assert.strictEqual(customerReceiptRes.status, 200, "Customer should be able to view their receipt using token");
  assert.strictEqual(Buffer.compare(customerReceiptRes.buffer, testReceiptContent), 0);

  // ---------------- TEST 6: TELEGRAM LOGGING ----------------
  console.log("➡️ Test 6: Telegram Notification Logging");
  const tgLogs = db.prepare("SELECT * FROM telegram_logs WHERE order_id = ?").all(createdOrder.id);
  assert.ok(tgLogs.length > 0, "Telegram log must exist");
  assert.ok(tgLogs[0].text.includes(`НОВЕ ЗАМОВЛЕННЯ #${createdOrder.number}`));
  assert.ok(tgLogs[0].text.includes("Оксана Забужко"));

  // ---------------- TEST 7: ADMIN AUTHENTICATION & ORDERS ----------------
  console.log("➡️ Test 7: Admin Authentication & Session Security");
  const unauthRes = await api("/api/admin/orders");
  assert.strictEqual(unauthRes.status, 401);

  const goodLoginRes = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "testadmin", password: "testpassword123" }),
  });
  assert.strictEqual(goodLoginRes.status, 200);
  const setCookieHeader = goodLoginRes.headers.get("set-cookie");
  assert.ok(setCookieHeader && setCookieHeader.includes("pasika_session="));
  assert.ok(setCookieHeader.includes("HttpOnly"));
  const sessionCookie = setCookieHeader.split(";")[0];

  const adminOrdersRes = await api("/api/admin/orders", {
    headers: { Cookie: sessionCookie },
  });
  assert.strictEqual(adminOrdersRes.status, 200);
  const foundOrder = adminOrdersRes.data.find((o) => o.id === createdOrder.id);
  assert.ok(foundOrder, "Admin must see created order");

  // Admin can download receipt file via cookie session
  const adminReceiptRes = await apiBytes(foundOrder.receipt.fileUrl, {
    headers: { Cookie: sessionCookie },
  });
  assert.strictEqual(adminReceiptRes.status, 200, "Admin must be able to view receipt");
  assert.strictEqual(Buffer.compare(adminReceiptRes.buffer, testReceiptContent), 0);

  // ---------------- TEST 8: STATUS UPDATES & SAFE STOCK RESTORATION ----------------
  console.log("➡️ Test 8: Status Updates & Safe Stock Check on Re-activation");

  // 8a. Cancel order -> stock restored (p1 +2, p3 +1)
  const cancelRes = await api(`/api/admin/orders/${createdOrder.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  assert.strictEqual(cancelRes.status, 200);
  const p1Restored = db.prepare("SELECT stock FROM products WHERE id = 'p1'").get();
  const p3Restored = db.prepare("SELECT stock FROM products WHERE id = 'p3'").get();
  assert.strictEqual(p1Restored.stock, initialP1Stock, "p1 stock must be restored to initial");
  assert.strictEqual(p3Restored.stock, initialP3Stock, "p3 stock must be restored to initial");

  // 8b. Simulate stock reduction while order was CANCELLED (e.g. p1 stock drops to 1, but order needs 2)
  db.prepare("UPDATE products SET stock = 1 WHERE id = 'p1'").run();

  // 8c. Attempting to restore CANCELLED order to 'PROCESSING' must FAIL and NOT allow negative stock!
  const failRestoreRes = await api(`/api/admin/orders/${createdOrder.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({ status: "PROCESSING" }),
  });
  assert.strictEqual(failRestoreRes.status, 400, "Re-activation with insufficient stock must fail (400)");
  assert.ok(failRestoreRes.data.error.includes("Недостатньо товару"), "Error should explain stock shortage");

  // Verify that stock was NOT made negative
  const p1StillSafe = db.prepare("SELECT stock FROM products WHERE id = 'p1'").get();
  assert.strictEqual(p1StillSafe.stock, 1, "Stock must remain 1 and not become negative");

  // Order status must remain CANCELLED due to rollback
  const orderStillCancelled = db.prepare("SELECT status FROM orders WHERE id = ?").get(createdOrder.id);
  assert.strictEqual(orderStillCancelled.status, "CANCELLED", "Order must remain CANCELLED after rollback");

  // 8d. When stock is replenished, re-activation succeeds and deducts stock safely
  db.prepare("UPDATE products SET stock = 10 WHERE id = 'p1'").run();
  const successRestoreRes = await api(`/api/admin/orders/${createdOrder.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({ status: "PROCESSING" }),
  });
  assert.strictEqual(successRestoreRes.status, 200, "Re-activation should succeed when stock is available");
  assert.strictEqual(successRestoreRes.data.status, "PROCESSING");
  const p1AfterSuccess = db.prepare("SELECT stock FROM products WHERE id = 'p1'").get();
  assert.strictEqual(p1AfterSuccess.stock, 8, "Stock must be deducted by 2 (10 - 2 = 8)");

  // ---------------- TEST 9: ADMIN LOGOUT ----------------
  console.log("➡️ Test 9: Admin Logout & Session Revocation");
  const logoutRes = await api("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: sessionCookie },
  });
  assert.strictEqual(logoutRes.status, 200);

  const afterLogoutRes = await api("/api/auth/me", {
    headers: { Cookie: sessionCookie },
  });
  assert.strictEqual(afterLogoutRes.status, 401, "Session must be revoked after logout");

  console.log("\n🎉 All 9 test suites in server/test-flow.js passed with 100% success!\n");
} finally {
  server.close();
}
