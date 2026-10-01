import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Setup test DB environment
const TEST_DB_PATH = path.resolve(__dirname, "../test-upgrade-pasika.db");
process.env.NODE_ENV = "test";
process.env.DB_PATH = TEST_DB_PATH;

if (fs.existsSync(TEST_DB_PATH)) {
  try { fs.unlinkSync(TEST_DB_PATH); } catch {}
}

console.log("\n============================================================");
console.log("🐝 PASIKA PRODUCTION UPGRADE AUTOMATED VERIFICATION SUITE");
console.log("============================================================\n");

// Import server modules after setting process.env.DB_PATH
const { db, initDatabase } = await import("../server/db.js");
initDatabase();
const { validateCartStock } = await import("../server/products.js");
const {
  createOrder,
  updateOrderStatus,
  confirmOrderPayment,
  getPublicOrderTrack,
} = await import("../server/orders.js");
const {
  checkDeliveryApi,
  getDeliveryAccounts,
  createDeliveryAccount,
  updateDeliveryAccount,
  deleteDeliveryAccount,
} = await import("../server/delivery.js");

function createMockReqRes({ body = {}, params = {}, query = {}, cookies = {}, headers = {}, admin = null } = {}) {
  let statusCode = 200;
  let responseBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseBody = data;
      return res;
    },
    send(data) {
      responseBody = data;
      return res;
    },
  };
  const req = {
    body,
    params,
    query,
    cookies,
    headers,
    admin,
  };
  return {
    req,
    res,
    getResult: () => ({ status: statusCode, body: responseBody }),
  };
}

let passedTests = 0;
function logPass(title) {
  passedTests++;
  console.log(`   ✅ [PASS ${passedTests}] ${title}`);
}

try {
  // ------------------------------------------------------------
  // TEST 1: Database Schema & Relational Tables
  // ------------------------------------------------------------
  console.log("👉 Test 1: Relational Schema Verification");
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => r.name);

  const requiredTables = [
    "users",
    "admin_users",
    "categories",
    "products",
    "orders",
    "order_items",
    "stock_reservations",
    "payments",
    "delivery_accounts",
    "shipments",
    "order_status_history",
    "settings",
  ];

  for (const table of requiredTables) {
    assert.ok(tables.includes(table), `Table '${table}' must exist in SQLite schema`);
  }
  logPass("All required production tables exist in SQLite schema");

  // Verify order_code column in orders table
  const orderColumns = db.prepare("PRAGMA table_info(orders)").all().map((c) => c.name);
  assert.ok(orderColumns.includes("order_code"), "orders table must have order_code column");
  assert.ok(orderColumns.includes("customer_token"), "orders table must have customer_token column");

  // Verify reserved_stock column in products table
  const prodColumns = db.prepare("PRAGMA table_info(products)").all().map((c) => c.name);
  assert.ok(prodColumns.includes("reserved_stock"), "products table must have reserved_stock column");
  logPass("Order code and reserved_stock columns verified");

  // ------------------------------------------------------------
  // TEST 2: Stock Formula & validateCartStock API
  // ------------------------------------------------------------
  console.log("\n👉 Test 2: Inventory Formula (available_stock = total - reserved)");
  const testProduct = db.prepare("SELECT * FROM products WHERE id = 'p1'").get();
  assert.ok(testProduct, "Seed product p1 must exist");

  const initialStock = Number(testProduct.stock);
  const initialReserved = Number(testProduct.reserved_stock || 0);
  const expectedAvailable = initialStock - initialReserved;
  console.log(`   ℹ️ Product '${testProduct.name}': total=${initialStock}, reserved=${initialReserved}, available=${expectedAvailable}`);

  // Test 2a: validateCartStock with acceptable qty
  {
    const { req, res, getResult } = createMockReqRes({
      body: { items: [{ id: testProduct.id, qty: Math.min(2, expectedAvailable) }] },
    });
    validateCartStock(req, res);
    const r = getResult();
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.valid, true);
    assert.ok(Array.isArray(r.body.items));
    assert.strictEqual(r.body.items[0].isAvailable, true);
    logPass("validateCartStock allows checkout within available stock");
  }

  // Test 2b: validateCartStock with excessive qty (overselling attempt)
  {
    const excessiveQty = expectedAvailable + 50;
    const { req, res, getResult } = createMockReqRes({
      body: { items: [{ id: testProduct.id, qty: excessiveQty }] },
    });
    validateCartStock(req, res);
    const r = getResult();
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.valid, false);
    assert.ok(Array.isArray(r.body.items), "Must return validated items");
    assert.strictEqual(r.body.items[0].requestedQty, excessiveQty);
    assert.strictEqual(r.body.items[0].availableStock, expectedAvailable);
    assert.strictEqual(r.body.items[0].isAvailable, false);
    logPass("validateCartStock blocks overselling and returns available limit");
  }

  // ------------------------------------------------------------
  // TEST 3: Sequential Order Code Generation & Order Placement
  // ------------------------------------------------------------
  console.log("\n👉 Test 3: Sequential Order Code Generation & Placement");
  let firstOrder = null;
  let secondOrder = null;

  // Create First Order
  {
    const { req, res, getResult } = createMockReqRes({
      body: {
        firstName: "Олена",
        lastName: "Коваль",
        phone: "+380 67 111 22 33",
        email: "olena@example.com",
        providerKey: "np",
        city: { id: "c1", name: "Київ" },
        branch: { id: "b1", name: "Відділення №1" },
        paymentMethod: "cod",
        comment: "Тестове замовлення 1",
        items: [{ id: testProduct.id, qty: 3 }],
      },
    });
    createOrder(req, res);
    const r = getResult();
    assert.strictEqual(r.status, 201, "Order creation must return 201");
    firstOrder = r.body.order;
    assert.ok(firstOrder.orderCode, "Order must have orderCode");
    assert.strictEqual(firstOrder.orderCode, `PAS-${firstOrder.number}`, "orderCode format PAS-{number}");
    assert.ok(firstOrder.number >= 10001, "Sequential number >= 10001");
    logPass(`First order created: ${firstOrder.orderCode} (Number: ${firstOrder.number})`);
  }

  // Create Second Order
  {
    const { req, res, getResult } = createMockReqRes({
      body: {
        firstName: "Тарас",
        lastName: "Шевченко",
        phone: "+380 50 222 33 44",
        email: "taras@example.com",
        providerKey: "np",
        city: { id: "c1", name: "Київ" },
        branch: { id: "b2", name: "Відділення №2" },
        paymentMethod: "cod",
        comment: "Тестове замовлення 2",
        items: [{ id: testProduct.id, qty: 2 }],
      },
    });
    createOrder(req, res);
    const r = getResult();
    assert.strictEqual(r.status, 201);
    secondOrder = r.body.order;
    assert.strictEqual(secondOrder.number, firstOrder.number + 1, "Sequential order number incremented by exactly 1");
    assert.strictEqual(secondOrder.orderCode, `PAS-${secondOrder.number}`);
    logPass(`Second order created sequentially: ${secondOrder.orderCode} (Number: ${secondOrder.number})`);
  }

  // ------------------------------------------------------------
  // TEST 4: Stock Reservation Verification
  // ------------------------------------------------------------
  console.log("\n👉 Test 4: Stock Reservation Isolation");
  const p1AfterOrders = db.prepare("SELECT stock, reserved_stock FROM products WHERE id = 'p1'").get();
  // 3 reserved in order 1, 2 reserved in order 2 = 5 total reserved
  assert.strictEqual(p1AfterOrders.stock, initialStock, "Physical stock must remain unchanged upon reservation");
  assert.strictEqual(p1AfterOrders.reserved_stock, initialReserved + 5, "Reserved stock must equal sum of reserved units");
  const newAvailable = p1AfterOrders.stock - p1AfterOrders.reserved_stock;
  assert.strictEqual(newAvailable, expectedAvailable - 5, "Available stock correctly reduced by 5");

  // Check active reservations in stock_reservations table
  const reservations = db
    .prepare("SELECT * FROM stock_reservations WHERE order_id IN (?, ?)")
    .all(firstOrder.id, secondOrder.id);
  assert.strictEqual(reservations.length, 2, "Must have 2 active reservation rows");
  assert.ok(reservations.every((r) => r.status === "ACTIVE"), "Reservations must be ACTIVE");
  logPass("Transactional stock reservation verified in DB table");

  // ------------------------------------------------------------
  // TEST 5: Order Cancellation & Reservation Release
  // ------------------------------------------------------------
  console.log("\n👉 Test 5: Cancellation & Reservation Release");
  {
    const { req, res, getResult } = createMockReqRes({
      params: { id: secondOrder.id },
      body: { status: "CANCELLED", comment: "Клієнт відмовився" },
      admin: { username: "admin" },
    });
    updateOrderStatus(req, res);
    const r = getResult();
    assert.strictEqual(r.status, 200);

    const p1AfterCancel = db.prepare("SELECT stock, reserved_stock FROM products WHERE id = 'p1'").get();
    // 2 units from secondOrder released, 3 from firstOrder remain reserved
    assert.strictEqual(p1AfterCancel.reserved_stock, initialReserved + 3, "Reserved stock decreased by cancelled 2 units");
    assert.strictEqual(p1AfterCancel.stock, initialStock, "Physical stock remains untouched");

    const resvSecond = db.prepare("SELECT status FROM stock_reservations WHERE order_id = ?").get(secondOrder.id);
    assert.strictEqual(resvSecond.status, "RELEASED", "Reservation status must be RELEASED");
    logPass("Order cancellation released reservation cleanly without touching physical stock");
  }

  // ------------------------------------------------------------
  // TEST 6: Fulfillment & Anti-Double-Deduction
  // ------------------------------------------------------------
  console.log("\n👉 Test 6: Order Fulfillment & Double-Deduction Protection");
  {
    // Transition firstOrder to SHIPPED (3 units should be deducted from physical stock, reserved released)
    const { req, res, getResult } = createMockReqRes({
      params: { id: firstOrder.id },
      body: { status: "SHIPPED", comment: "Передано перевізнику" },
      admin: { username: "admin" },
    });
    updateOrderStatus(req, res);
    const r = getResult();
    assert.strictEqual(r.status, 200);

    const p1AfterShip = db.prepare("SELECT stock, reserved_stock FROM products WHERE id = 'p1'").get();
    assert.strictEqual(p1AfterShip.stock, initialStock - 3, "Physical stock reduced by 3 units");
    assert.strictEqual(p1AfterShip.reserved_stock, initialReserved, "Reserved stock reduced by 3 units (fulfilled)");

    const resvFirst = db.prepare("SELECT status FROM stock_reservations WHERE order_id = ?").get(firstOrder.id);
    assert.strictEqual(resvFirst.status, "FULFILLED", "Reservation status must be FULFILLED");
    logPass("Fulfillment deducted physical stock and fulfilled reservation");

    // Transition firstOrder to DELIVERED and then COMPLETED: Verify NO double deduction!
    for (const nextStatus of ["DELIVERED", "COMPLETED"]) {
      const { req: rReq, res: rRes, getResult: rGet } = createMockReqRes({
        params: { id: firstOrder.id },
        body: { status: nextStatus },
        admin: { username: "admin" },
      });
      updateOrderStatus(rReq, rRes);
      assert.strictEqual(rGet().status, 200);

      const p1DoubleCheck = db.prepare("SELECT stock, reserved_stock FROM products WHERE id = 'p1'").get();
      assert.strictEqual(p1DoubleCheck.stock, initialStock - 3, `Stock must not decrease again on ${nextStatus}`);
    }
    logPass("Anti-double-deduction verified across DELIVERED and COMPLETED");
  }

  // ------------------------------------------------------------
  // TEST 7: Receipt Payment Flow & confirmOrderPayment
  // ------------------------------------------------------------
  console.log("\n👉 Test 7: Payment Confirmation Workflow");
  let paidOrder = null;
  {
    // Create an order with AWAITING_PAYMENT status
    const { req, res, getResult } = createMockReqRes({
      body: {
        firstName: "Марія",
        lastName: "Франко",
        phone: "+380 93 444 55 66",
        providerKey: "np",
        city: { id: "c1", name: "Київ" },
        branch: { id: "b1", name: "Відділення №1" },
        paymentMethod: "card",
        receiptUrl: "/uploads/receipts/test_receipt.jpg",
        receiptName: "test_receipt.jpg",
        items: [{ id: testProduct.id, qty: 1 }],
      },
    });
    createOrder(req, res);
    const r = getResult();
    assert.strictEqual(r.status, 201);
    paidOrder = r.body.order;
    assert.strictEqual(paidOrder.status, "AWAITING_PAYMENT", "Order with card receipt must start in AWAITING_PAYMENT");
    logPass(`Order ${paidOrder.orderCode} placed in AWAITING_PAYMENT state`);

    // Admin verifies receipt and clicks [Підтвердити оплату]
    const { req: pReq, res: pRes, getResult: pGet } = createMockReqRes({
      params: { id: paidOrder.id },
      admin: { username: "admin" },
    });
    confirmOrderPayment(pReq, pRes);
    const pResult = pGet();
    assert.strictEqual(pResult.status, 200);
    assert.strictEqual(pResult.body.order.status, "PAID", "Order status transitioned to PAID");

    // Verify payment row in payments table
    const paymentRow = db.prepare("SELECT * FROM payments WHERE order_id = ?").get(paidOrder.id);
    assert.ok(paymentRow, "Payment record must exist");
    assert.strictEqual(paymentRow.status, "PAID");
    assert.strictEqual(paymentRow.confirmed_by, "admin");
    assert.ok(paymentRow.confirmed_at > 0);

    // Verify history timeline
    const history = db
      .prepare("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at DESC")
      .all(paidOrder.id);
    assert.ok(history.some((h) => h.to_status === "PAID"), "Status history must record transition to PAID");
    logPass("confirmOrderPayment atomically updated status, payment record, and history");
  }

  // ------------------------------------------------------------
  // TEST 8: Public Order Tracking with Privacy Protection
  // ------------------------------------------------------------
  console.log("\n👉 Test 8: Public Order Tracking (/track-order endpoint)");
  {
    // Search by orderCode "PAS-xxxxx"
    const { req, res, getResult } = createMockReqRes({
      params: { query: paidOrder.orderCode },
    });
    getPublicOrderTrack(req, res);
    const r = getResult();
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.orderCode, paidOrder.orderCode);
    assert.strictEqual(r.body.status, "PAID");
    assert.strictEqual(r.body.statusLabel, "Оплачено");
    assert.ok(Array.isArray(r.body.items));
    assert.ok(Array.isArray(r.body.statusHistory));

    // PRIVACY LEAK CHECKS
    assert.strictEqual(r.body.customer, undefined, "Must NOT leak full customer object");
    assert.strictEqual(r.body.phone, undefined, "Must NOT leak customer phone");
    assert.strictEqual(r.body.email, undefined, "Must NOT leak customer email");
    assert.strictEqual(r.body.customer_phone, undefined, "Must NOT leak raw customer_phone");
    assert.strictEqual(r.body.customer_email, undefined, "Must NOT leak raw customer_email");
    logPass("Public order tracking returns order status without exposing customer PII");

    // Search by numeric ID (e.g. 10003)
    const { req: qReq, res: qRes, getResult: qGet } = createMockReqRes({
      params: { query: String(paidOrder.number) },
    });
    getPublicOrderTrack(qReq, qRes);
    assert.strictEqual(qGet().status, 200);
    assert.strictEqual(qGet().body.orderCode, paidOrder.orderCode);
    logPass("Public order tracking resolves bare numeric input");

    // Search for non-existent order
    const { req: errReq, res: errRes, getResult: errGet } = createMockReqRes({
      params: { query: "PAS-999999" },
    });
    getPublicOrderTrack(errReq, errRes);
    assert.strictEqual(errGet().status, 404);
    logPass("Non-existent order returns 404 Not Found");
  }

  // ------------------------------------------------------------
  // TEST 9: Multi-Account Delivery Settings CRUD
  // ------------------------------------------------------------
  console.log("\n👉 Test 9: Multi-Account Delivery Configuration");
  let createdAcc = null;
  {
    // Create new account
    createdAcc = createDeliveryAccount({
      name: "Nova Poshta — Додатковий склад",
      provider: "np",
      apiKey: "np_sec_key_sample_12345678",
      senderName: "Пасічник Василь",
      phone: "+380671234567",
      cityName: "Вінниця",
      warehouseName: "Відділення №5",
      isDefault: false,
      isActive: true,
    });
    assert.ok(createdAcc && createdAcc.id);
    assert.strictEqual(createdAcc.name, "Nova Poshta — Додатковий склад");
    logPass("Created delivery account in database");

    // List accounts
    const accountsList = getDeliveryAccounts();
    assert.ok(Array.isArray(accountsList));
    const found = accountsList.find((a) => a.id === createdAcc.id);
    assert.ok(found, "Account must appear in list");
    assert.strictEqual(found.apiKeyMasked, "••••••••••••••••", "List must never expose plain API key");
    logPass("Retrieved delivery accounts list with masked security");

    // Update account
    const updated = updateDeliveryAccount(createdAcc.id, {
      name: "Nova Poshta — Оновлений склад",
      cityName: "Тернопіль",
    });
    assert.strictEqual(updated.name, "Nova Poshta — Оновлений склад");
    assert.strictEqual(updated.city_name, "Тернопіль");
    logPass("Updated delivery account");

    // Delete account
    const deleted = deleteDeliveryAccount(createdAcc.id);
    assert.strictEqual(deleted, true);
    const checkDeleted = db.prepare("SELECT * FROM delivery_accounts WHERE id = ?").get(createdAcc.id);
    assert.strictEqual(checkDeleted, undefined);
    logPass("Deleted delivery account cleanly from SQLite");
  }

  // ------------------------------------------------------------
  // TEST 10: Delivery API Key Verification Handler
  // ------------------------------------------------------------
  console.log("\n👉 Test 10: Postal Services Live API Verification Endpoint");
  {
    // Test checkDeliveryApi when key is empty / not configured
    const npEmpty = await checkDeliveryApi("np", "");
    assert.strictEqual(npEmpty.ok, false);
    assert.strictEqual(npEmpty.status, "not_configured");
    logPass("checkDeliveryApi reports 'not_configured' for empty Nova Poshta key");

    const upEmpty = await checkDeliveryApi("up", "");
    assert.strictEqual(upEmpty.ok, false);
    assert.strictEqual(upEmpty.status, "not_configured");
    logPass("checkDeliveryApi reports 'not_configured' for empty Ukrposhta key");
  }

  console.log("\n============================================================");
  console.log(`🏆 ALL ${passedTests} PRODUCTION UPGRADE TESTS PASSED PERFECTLY!`);
  console.log("============================================================\n");
} catch (err) {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
} finally {
  try {
    db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(TEST_DB_PATH + "-shm")) fs.unlinkSync(TEST_DB_PATH + "-shm");
    if (fs.existsSync(TEST_DB_PATH + "-wal")) fs.unlinkSync(TEST_DB_PATH + "-wal");
  } catch {}
}
