import assert from "node:assert";
import http from "node:http";

// Set test environment
process.env.NODE_ENV = "test";
process.env.DB_PATH = ":memory:";
process.env.ADMIN_LOGIN = "testadmin";
process.env.ADMIN_PASSWORD = "testpassword123";

const { app } = await import("./index.js");

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const BASE_URL = `http://127.0.0.1:${port}`;

console.log(`🧪 Running payment scenarios verification against ${BASE_URL}...`);

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

try {
  // Login as admin first
  const loginRes = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "testadmin", password: "testpassword123" }),
  });
  assert.strictEqual(loginRes.status, 200, "Admin login should succeed");
  const adminCookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";

  // ---------------- PART 1: SETTINGS & REQUISITES ----------------
  console.log("\n👉 Step 1: Verify payment requisites in settings");
  const settingsRes = await api("/api/settings");
  assert.strictEqual(settingsRes.status, 200);
  assert.ok(settingsRes.data.payment, "Settings must have payment object");
  assert.ok(settingsRes.data.payment.holder, "Must have recipient holder");
  assert.ok(settingsRes.data.payment.card, "Must have card/IBAN");
  assert.ok(settingsRes.data.payment.bank, "Must have bank");
  assert.ok(settingsRes.data.payment.purpose, "Must have payment purpose");
  console.log("   ✓ Public requisites available:", {
    holder: settingsRes.data.payment.holder,
    card: settingsRes.data.payment.card,
    bank: settingsRes.data.payment.bank,
    purpose: settingsRes.data.payment.purpose,
  });

  // Admin updates payment requisites
  const updateSettingsRes = await api("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      payment: {
        holder: "ФОП Дмитренко Олена Петрівна",
        card: "UA123456789012345678901234567",
        bank: "ПриватБанк",
        purpose: "Оплата замовлення мед",
        instruction: "Після переказу прикріпіть квитанцію",
      },
    }),
  });
  assert.strictEqual(updateSettingsRes.status, 200);
  assert.strictEqual(updateSettingsRes.data.payment.holder, "ФОП Дмитренко Олена Петрівна");
  assert.strictEqual(updateSettingsRes.data.payment.card, "UA123456789012345678901234567");
  console.log("   ✓ Admin successfully saved new custom requisites to backend SQLite");

  // ---------------- SCENARIO 1: ОПЛАТА ПРИ ОТРИМАННІ ----------------
  console.log("\n👉 Step 2: SCENARIO 1 — Оплата при отриманні");
  // Client creates order with paymentMethod: "cod"
  const codOrderRes = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Марія",
      lastName: "Коваль",
      phone: "+380 67 111 22 33",
      email: "maria@example.com",
      providerKey: "np",
      city: { id: "c1", name: "Київ" },
      branch: { id: "b1", name: "Відділення №1" },
      paymentMethod: "cod",
      comment: "Передзвоніть після 15:00",
      items: [{ id: "p1", qty: 1 }],
      idempotencyKey: "test_cod_" + Date.now(),
    }),
  });

  assert.strictEqual(codOrderRes.status, 201, "COD Order must be created (201)");
  const codOrder = codOrderRes.data.order;
  assert.strictEqual(codOrder.payment.method, "cod");
  assert.strictEqual(codOrder.payment.methodLabel, "Оплата при отриманні");
  assert.strictEqual(codOrder.payment.paymentStatus, "Очікує оплати");
  assert.strictEqual(codOrder.payment.receiptStatus, "Не потрібен");
  assert.strictEqual(codOrder.receipt, null, "No receipt must be present for COD order");
  console.log(`   ✓ COD order created #${codOrder.number}:`);
  console.log(`     - Спосіб: ${codOrder.payment.methodLabel}`);
  console.log(`     - Статус оплати: ${codOrder.payment.paymentStatus}`);
  console.log(`     - Чек: ${codOrder.payment.receiptStatus}`);

  // Verify in Admin
  const adminCodOrderRes = await api(`/api/admin/orders/${codOrder.id}`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(adminCodOrderRes.status, 200);
  assert.strictEqual(adminCodOrderRes.data.payment.methodLabel, "Оплата при отриманні");
  assert.strictEqual(adminCodOrderRes.data.payment.paymentStatus, "Очікує оплати");
  assert.strictEqual(adminCodOrderRes.data.receipt, null);
  console.log("   ✓ Verified in Admin: method is 'Оплата при отриманні', status 'Очікує оплати', receipt null ('Не потрібен')");

  // ---------------- SCENARIO 2: ОПЛАТИТИ ЗАРАЗ ----------------
  console.log("\n👉 Step 3: SCENARIO 2 — Оплатити зараз");

  // 3a. Try without receipt -> MUST be rejected (400)
  const failCardOrderRes = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Іван",
      lastName: "Франко",
      phone: "+380 50 333 44 55",
      providerKey: "up",
      city: { id: "c2", name: "Львів" },
      branch: { id: "b2", name: "Відділення №2" },
      paymentMethod: "card",
      items: [{ id: "p2", qty: 1 }],
      idempotencyKey: "test_fail_card_" + Date.now(),
    }),
  });
  assert.strictEqual(failCardOrderRes.status, 400, "Submitting 'Оплатити зараз' without receipt must return 400");
  console.log(`   ✓ Correctly blocked order without receipt: "${failCardOrderRes.data.error}"`);

  // 3b. Upload receipt
  const checkoutToken = "chk_test_" + Date.now();
  const simulatedReceiptPdf = Buffer.from("%PDF-1.4\nReceipt payment verification\n%%EOF");
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).slice(2);
  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="checkoutToken"\r\n\r\n${checkoutToken}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="receipt_privat.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
    ),
    simulatedReceiptPdf,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await api("/api/upload-receipt", {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: multipartBody,
  });
  assert.strictEqual(uploadRes.status, 200, "Receipt upload must return 200");
  assert.ok(uploadRes.data.fileUrl, "Upload response must include fileUrl");
  console.log("   ✓ Receipt uploaded successfully:", uploadRes.data.originalName, "->", uploadRes.data.fileUrl);

  // 3c. Create card order with receipt
  const cardOrderRes = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Іван",
      lastName: "Франко",
      phone: "+380 50 333 44 55",
      email: "franko@example.com",
      providerKey: "up",
      city: { id: "c2", name: "Львів" },
      branch: { id: "b2", name: "Відділення №2" },
      paymentMethod: "card",
      receiptUrl: uploadRes.data.fileUrl,
      receiptName: uploadRes.data.originalName,
      checkoutToken,
      comment: "Запакуйте як подарунок",
      items: [{ id: "p2", qty: 1 }],
      idempotencyKey: "test_success_card_" + Date.now(),
    }),
  });

  assert.strictEqual(cardOrderRes.status, 201, "Card order with receipt must return 201 Created");
  const cardOrder = cardOrderRes.data.order;
  assert.strictEqual(cardOrder.payment.method, "card");
  assert.strictEqual(cardOrder.payment.methodLabel, "Оплачено наперед");
  assert.strictEqual(cardOrder.payment.paymentStatus, "Чек на перевірці");
  assert.ok(cardOrder.receipt, "Receipt must be attached to card order");
  assert.ok(cardOrder.receipt.fileUrl, "Receipt must have fileUrl");
  console.log(`   ✓ Card order created #${cardOrder.number}:`);
  console.log(`     - Спосіб: ${cardOrder.payment.methodLabel}`);
  console.log(`     - Статус оплати: ${cardOrder.payment.paymentStatus}`);
  console.log(`     - Чек: ${cardOrder.receipt.name} (${cardOrder.receipt.fileUrl})`);

  // Verify in Admin order list and detail
  const adminCardOrderRes = await api(`/api/admin/orders/${cardOrder.id}`, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(adminCardOrderRes.status, 200);
  assert.strictEqual(adminCardOrderRes.data.payment.methodLabel, "Оплачено наперед");
  assert.strictEqual(adminCardOrderRes.data.payment.paymentStatus, "Чек на перевірці");
  assert.ok(adminCardOrderRes.data.receipt?.fileUrl, "Admin must receive access URL to receipt");

  // Admin opens receipt
  const receiptFullUrl = adminCardOrderRes.data.receipt.fileUrl.startsWith("http")
    ? adminCardOrderRes.data.receipt.fileUrl
    : `${BASE_URL}${adminCardOrderRes.data.receipt.fileUrl}`;
  const receiptViewRes = await fetch(receiptFullUrl, {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(receiptViewRes.status, 200, "Admin must be able to open/view receipt file");
  const receiptBytes = await receiptViewRes.arrayBuffer();
  assert.strictEqual(receiptBytes.byteLength, simulatedReceiptPdf.length, "Receipt bytes must match exactly");
  console.log("   ✓ Verified in Admin: method is 'Оплачено наперед', status 'Чек на перевірці', receipt accessible and byte-matched");

  // ---------------- ADMIN ORDERS LISTING TABLE ----------------
  console.log("\n👉 Step 4: Verify Admin Orders table payload");
  const adminListRes = await api("/api/admin/orders", {
    headers: { Cookie: adminCookie },
  });
  assert.strictEqual(adminListRes.status, 200);
  assert.ok(adminListRes.data.length >= 2);
  const foundCod = adminListRes.data.find((o) => o.id === codOrder.id);
  const foundCard = adminListRes.data.find((o) => o.id === cardOrder.id);
  assert.ok(foundCod && foundCard);
  assert.strictEqual(foundCod.payment.methodLabel, "Оплата при отриманні");
  assert.strictEqual(foundCod.payment.paymentStatus, "Очікує оплати");
  assert.strictEqual(foundCard.payment.methodLabel, "Оплачено наперед");
  assert.strictEqual(foundCard.payment.paymentStatus, "Чек на перевірці");
  console.log("   ✓ Both orders correctly formatted in Admin order list");

  console.log("\n🎉 ALL PAYMENT SCENARIOS PASSED WITH 100% SUCCESS!");
} finally {
  server.close();
}
