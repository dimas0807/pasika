import assert from "node:assert";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure test environment
process.env.NODE_ENV = "test";
process.env.DB_PATH = path.resolve(__dirname, "test-pasika.db");
process.env.ADMIN_LOGIN = "admin";
process.env.ADMIN_PASSWORD = "pasika2026";

// Clean any previous test DB
if (fs.existsSync(process.env.DB_PATH)) {
  fs.unlinkSync(process.env.DB_PATH);
}

const { app } = await import("./server/index.js");
const { db } = await import("./server/db.js");

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const BASE = `http://127.0.0.1:${port}`;

console.log(`\n======================================================`);
console.log(`🚀 Starting Full End-to-End Flow Verification (${BASE})`);
console.log(`======================================================\n`);

async function req(urlPath, options = {}) {
  const url = `${BASE}${urlPath}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, ok: res.ok, headers: res.headers, body: json || text };
}

try {
  // ---------------- STEP 1: BROWSE CATALOG & PICK PRODUCTS ----------------
  console.log("👉 Step 1: Browse catalog and pick products");
  const prodsRes = await req("/api/products");
  assert.strictEqual(prodsRes.status, 200, "Should get products list");
  assert.ok(prodsRes.body.length >= 10, "Should have seeded products");

  const honeyProduct = prodsRes.body.find((p) => p.id === "p1");
  const creamHoneyProduct = prodsRes.body.find((p) => p.id === "p3");
  assert.ok(honeyProduct, "Should find p1 (Мед натуральний)");
  assert.ok(creamHoneyProduct, "Should find p3 (Крем-мед)");

  const initialHoneyStock = honeyProduct.stock;
  const initialCreamStock = creamHoneyProduct.stock;
  console.log(`   ✓ Selected '${honeyProduct.name}' (current stock: ${initialHoneyStock})`);
  console.log(`   ✓ Selected '${creamHoneyProduct.name}' (current stock: ${initialCreamStock})`);

  // ---------------- STEP 2: CART SELECTION ----------------
  console.log("\n👉 Step 2: Add items to cart");
  const cartItems = [
    { id: honeyProduct.id, name: honeyProduct.name, price: honeyProduct.price, qty: 2 },
    { id: creamHoneyProduct.id, name: creamHoneyProduct.name, price: creamHoneyProduct.price, qty: 1 },
  ];
  const expectedSubtotal = honeyProduct.price * 2 + creamHoneyProduct.price * 1;
  console.log(`   ✓ Cart contains 2 items, total expected: ${expectedSubtotal} грн`);

  // ---------------- STEP 3: CHECKOUT & DELIVERY RESOLUTION ----------------
  console.log("\n👉 Step 3: Delivery search via server-side API");
  const citySearchRes = await req("/api/delivery/cities?provider=np&query=Київ");
  assert.strictEqual(citySearchRes.status, 200);
  assert.ok(citySearchRes.body.length > 0, "Should return matching cities");
  const selectedCity = citySearchRes.body[0];
  assert.ok(selectedCity.id && selectedCity.name, "City must have real id and name");
  console.log(`   ✓ Selected city: ${selectedCity.name} [ID: ${selectedCity.id}]`);

  const branchSearchRes = await req(`/api/delivery/branches?provider=np&cityId=${selectedCity.id}`);
  assert.strictEqual(branchSearchRes.status, 200);
  assert.ok(branchSearchRes.body.length > 0, "Should return branches for city");
  const selectedBranch = branchSearchRes.body[0];
  assert.ok(selectedBranch.id && selectedBranch.name, "Branch must have real id and name");
  console.log(`   ✓ Selected branch: ${selectedBranch.name} [ID: ${selectedBranch.id}]`);

  // ---------------- STEP 4: PAYMENT & RECEIPT UPLOAD ----------------
  console.log("\n👉 Step 4: Upload payment receipt to file storage");
  const checkoutToken = "e2e_chk_" + Date.now();
  const receiptFileContent = Buffer.from("%PDF-1.4\nSimulated bank payment receipt for order\n%%EOF");
  const boundary = "----TestBoundary" + Date.now();
  const multipart = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="checkoutToken"\r\n\r\n${checkoutToken}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="my_receipt.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    receiptFileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await req("/api/upload-receipt", {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: multipart,
  });
  assert.strictEqual(uploadRes.status, 200, "Receipt upload must return 200");
  assert.ok(uploadRes.body.fileUrl, "Upload must return fileUrl");
  console.log(`   ✓ Receipt uploaded to server: ${uploadRes.body.fileUrl}`);

  // Verify that unauthorized access without token is blocked (403)
  const unauthFileRes = await req(uploadRes.body.fileUrl);
  assert.strictEqual(unauthFileRes.status, 403, "Public access to receipt without token must be blocked (403)");

  // Verify that authorized access with checkoutToken succeeds byte-for-byte
  const staticFileRes = await req(`${uploadRes.body.fileUrl}?token=${checkoutToken}`);
  assert.strictEqual(staticFileRes.status, 200, "Receipt file must be downloadable with token");
  assert.strictEqual(staticFileRes.body, receiptFileContent.toString(), "Receipt content must match exactly");
  console.log(`   ✓ Verified file storage security and byte-for-byte downloadability`);

  // ---------------- STEP 5: ORDER CREATION & STOCK DEDUCTION ----------------
  console.log("\n👉 Step 5: Server-side Order Creation with Validation & Stock Reservation");

  // 5a. Validation failure test (invalid phone)
  const badOrderRes = await req("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Андрій",
      lastName: "Шевченко",
      phone: "000",
      items: [{ id: honeyProduct.id, qty: 1 }],
      delivery: { providerKey: "np", city: selectedCity, branch: selectedBranch },
      paymentMethod: "card",
    }),
  });
  assert.strictEqual(badOrderRes.status, 400, "Invalid phone must be rejected");
  console.log(`   ✓ Correctly rejected invalid phone: ${badOrderRes.body.error}`);

  // 5b. Validation failure test (exceeding stock)
  const overStockRes = await req("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Андрій",
      lastName: "Шевченко",
      phone: "+380501112233",
      items: [{ id: honeyProduct.id, qty: initialHoneyStock + 50 }],
      delivery: { providerKey: "np", city: selectedCity, branch: selectedBranch },
      paymentMethod: "card",
    }),
  });
  assert.strictEqual(overStockRes.status, 400, "Out-of-stock items must be rejected");
  console.log(`   ✓ Correctly rejected out-of-stock order: ${overStockRes.body.error}`);

  // 5c. Valid Order Creation
  const idempotencyKey = "e2e_key_" + Date.now();
  const orderRes = await req("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Андрій",
      lastName: "Шевченко",
      phone: "+380 50 111 22 33",
      email: "sheva@example.com",
      providerKey: "np",
      city: selectedCity,
      branch: selectedBranch,
      paymentMethod: "card",
      receiptUrl: uploadRes.body.fileUrl,
      receiptName: "my_receipt.pdf",
      comment: "Будь ласка, запакуйте надійно",
      items: cartItems.map((i) => ({ id: i.id, qty: i.qty })),
      idempotencyKey,
      checkoutToken,
    }),
  });

  assert.strictEqual(orderRes.status, 201, "Order creation must return 201 Created");
  const order = orderRes.body.order;
  const customerToken = orderRes.body.customerToken;
  assert.ok(customerToken, "Order response must return customerToken");
  assert.ok(order.id, "Order must have unique ID");
  assert.strictEqual(typeof order.number, "number", "Order must have numeric number");
  assert.strictEqual(order.total, expectedSubtotal, "Order total must match prices");
  assert.strictEqual(order.delivery.cityId, selectedCity.id, "Real city ID must be stored");
  assert.strictEqual(order.delivery.branchId, selectedBranch.id, "Real branch ID must be stored");
  assert.ok(order.receipt.fileUrl.startsWith(uploadRes.body.fileUrl), "Receipt fileUrl must be stored");
  console.log(`   ✓ Order #${order.number} successfully created (Total: ${order.total} грн)`);
  console.log(`   ✓ City ID: ${order.delivery.cityId}, Branch ID: ${order.delivery.branchId}`);

  // 5d. Verify stock deduction in database
  const honeyAfter = db.prepare("SELECT stock FROM products WHERE id = 'p1'").get();
  const creamAfter = db.prepare("SELECT stock FROM products WHERE id = 'p3'").get();
  assert.strictEqual(honeyAfter.stock, initialHoneyStock - 2, "Honey stock must be reduced by 2");
  assert.strictEqual(creamAfter.stock, initialCreamStock - 1, "Cream honey stock must be reduced by 1");
  console.log(`   ✓ Stock updated in SQLite: 'p1' was ${initialHoneyStock} -> now ${honeyAfter.stock}`);
  console.log(`   ✓ Stock updated in SQLite: 'p3' was ${initialCreamStock} -> now ${creamAfter.stock}`);

  // 5e. Test idempotency (repeated submit protection)
  const dupOrderRes = await req("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Андрій",
      lastName: "Шевченко",
      phone: "+380 50 111 22 33",
      items: cartItems.map((i) => ({ id: i.id, qty: i.qty })),
      idempotencyKey,
      checkoutToken,
    }),
  });
  assert.strictEqual(dupOrderRes.status, 200, "Duplicate submit must return 200");
  assert.strictEqual(dupOrderRes.body.order.id, order.id, "Duplicate submit must return existing order");
  assert.strictEqual(dupOrderRes.body.duplicate, true, "Duplicate flag must be true");
  const honeyAfterDup = db.prepare("SELECT stock FROM products WHERE id = 'p1'").get();
  assert.strictEqual(honeyAfterDup.stock, initialHoneyStock - 2, "Stock must NOT be deducted again on duplicate");
  console.log(`   ✓ Idempotency protected against repeat submission (same order returned, stock preserved)`);

  // 5f. Public Order Lookup (OrderSuccess page flow)
  // Verify unauthorized access without token is blocked (403)
  const unauthOrderRes = await req(`/api/orders/${order.id}`);
  assert.strictEqual(unauthOrderRes.status, 403, "Public access to order PII without token must be blocked (403)");

  // Verify authorized access with customerToken succeeds (200)
  const pubOrderRes = await req(`/api/orders/${order.id}?token=${customerToken}`);
  assert.strictEqual(pubOrderRes.status, 200);
  assert.strictEqual(pubOrderRes.body.number, order.number);
  console.log(`   ✓ OrderSuccess page endpoint /api/orders/${order.id}?token=... returned correct details (unauthenticated blocked with 403)`);

  // ---------------- STEP 6: TELEGRAM NOTIFICATION ----------------
  console.log("\n👉 Step 6: Telegram notification verification");
  const tgLogs = db.prepare("SELECT * FROM telegram_logs WHERE order_id = ?").all(order.id);
  assert.ok(tgLogs.length > 0, "Must create telegram log for the order");
  assert.ok(tgLogs[0].text.includes(`НОВЕ ЗАМОВЛЕННЯ #${order.number}`), "Telegram message must contain order number");
  assert.ok(tgLogs[0].text.includes("Андрій Шевченко"), "Telegram message must contain customer name");
  assert.ok(tgLogs[0].text.includes(`${order.total} грн`), "Telegram message must contain total sum");
  console.log(`   ✓ Telegram message generated and logged to SQLite (Status: ${tgLogs[0].status})`);
  console.log(`   --- Message snippet ---\n${tgLogs[0].text.split('\n').slice(0, 7).join('\n')}\n   -----------------------`);

  // ---------------- STEP 7: ADMIN AUTHENTICATION ----------------
  console.log("\n👉 Step 7: Admin authentication & session security");
  // 7a. Unauthenticated access check
  const unauthRes = await req("/api/admin/dashboard");
  assert.strictEqual(unauthRes.status, 401, "Admin dashboard must be protected (401)");
  console.log(`   ✓ Protected admin route blocked unauthorized access (401)`);

  // 7b. Invalid login
  const badLoginRes = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", password: "wrong_password" }),
  });
  assert.strictEqual(badLoginRes.status, 401);
  console.log(`   ✓ Rejected invalid admin password (401)`);

  // 7c. Valid login
  const loginRes = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "admin", password: "pasika2026" }),
  });
  assert.strictEqual(loginRes.status, 200);
  const cookieHeader = loginRes.headers.get("set-cookie");
  assert.ok(cookieHeader && cookieHeader.includes("pasika_session="), "Must set pasika_session cookie");
  assert.ok(cookieHeader.includes("HttpOnly"), "Session cookie must have HttpOnly flag");
  const cookie = cookieHeader.split(";")[0];
  console.log(`   ✓ Admin logged in successfully with HttpOnly session cookie`);

  // 7d. Check /api/auth/me
  const meRes = await req("/api/auth/me", { headers: { Cookie: cookie } });
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.body.authenticated, true);
  assert.strictEqual(meRes.body.username, "admin");
  console.log(`   ✓ Verified session via /api/auth/me (authenticated: true, user: admin)`);

  // ---------------- STEP 8: ADMIN DASHBOARD & ORDER MANAGEMENT ----------------
  console.log("\n👉 Step 8: Admin Dashboard and Order Management");
  const dashRes = await req("/api/admin/dashboard", { headers: { Cookie: cookie } });
  assert.strictEqual(dashRes.status, 200);
  assert.strictEqual(dashRes.body.kpis.ordersToday >= 1, true, "Orders today KPI must include the order");
  assert.strictEqual(dashRes.body.kpis.newOrders >= 1, true, "New orders KPI must include the order");
  assert.strictEqual(dashRes.body.kpis.totalRevenue >= order.total, true, "Total revenue must reflect order total");
  assert.ok(dashRes.body.recentOrders.some((o) => o.id === order.id), "Recent orders must list the created order");
  assert.ok(dashRes.body.telegramLogs.length > 0, "Dashboard must show recent Telegram logs");
  console.log(`   ✓ Dashboard loaded KPIs: new orders=${dashRes.body.kpis.newOrders}, revenue=${dashRes.body.kpis.totalRevenue} грн`);

  // 8b. View Order in Admin Orders List
  const adminOrdersRes = await req("/api/admin/orders", { headers: { Cookie: cookie } });
  assert.strictEqual(adminOrdersRes.status, 200);
  const orderInList = adminOrdersRes.body.find((o) => o.id === order.id);
  assert.ok(orderInList, "Order must be in admin list");
  assert.ok(orderInList.receipt.fileUrl.startsWith(uploadRes.body.fileUrl), "Admin must see uploaded receipt");
  console.log(`   ✓ Order found in admin list with status '${orderInList.status}' and receipt URL '${orderInList.receipt.fileUrl}'`);

  // 8c. Change Order Status to PROCESSING -> SHIPPED
  const statusShipRes = await req(`/api/admin/orders/${order.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "SHIPPED" }),
  });
  assert.strictEqual(statusShipRes.status, 200);
  assert.strictEqual(statusShipRes.body.status, "SHIPPED");
  console.log(`   ✓ Admin changed order status to 'SHIPPED'`);

  // 8d. Change Order Status to CANCELLED and verify stock restoration
  const statusCancelRes = await req(`/api/admin/orders/${order.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  assert.strictEqual(statusCancelRes.status, 200);
  assert.strictEqual(statusCancelRes.body.status, "CANCELLED");

  const honeyRestored = db.prepare("SELECT stock FROM products WHERE id = 'p1'").get();
  assert.strictEqual(honeyRestored.stock, initialHoneyStock, "Stock must be fully restored upon cancellation");
  console.log(`   ✓ Order cancelled and stock restored to original level (${honeyRestored.stock} pcs)`);

  // 8e. Admin Logout
  const logoutRes = await req("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: cookie },
  });
  assert.strictEqual(logoutRes.status, 200);
  const afterLogoutMe = await req("/api/auth/me", { headers: { Cookie: cookie } });
  assert.strictEqual(afterLogoutMe.status, 401, "Session must be revoked after logout");
  console.log(`   ✓ Admin logged out and session revoked`);

  console.log(`\n======================================================`);
  console.log(`🏆 COMPLETE END-TO-END FLOW VERIFIED SUCCESSFULLY!`);
  console.log(`======================================================\n`);
} finally {
  server.close();
  if (fs.existsSync(process.env.DB_PATH)) {
    try { fs.unlinkSync(process.env.DB_PATH); } catch {}
  }
}
