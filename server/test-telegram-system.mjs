import { initDatabase, db } from "./db.js";
import {
  getTelegramConfig,
  updateTelegramConfig,
  getTelegramRecipients,
  createTelegramRecipient,
  updateTelegramRecipient,
  deleteTelegramRecipient,
  toggleTelegramRecipient,
  testRecipientNotification,
  getRecentTelegramInteractions,
  handleTelegramWebhook,
  formatOrderMessage,
  buildOrderInlineKeyboard,
  sendOrderTelegramNotification,
} from "./telegram/index.js";
import { createOrder, getFullOrder } from "./orders.js";

console.log("==================================================");
console.log("🐝 PASIKA TELEGRAM MODULE COMPREHENSIVE TEST SUITE");
console.log("==================================================\n");

initDatabase();

// Test reporting helper
const results = [];
function test(name, passed, details = "") {
  results.push({ name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} : ${name}${details ? ` -> ${details}` : ""}`);
}

// Mock Request & Response helpers
function mockReq(body = {}, params = {}, query = {}, headers = {}, cookies = {}) {
  return { body, params, query, headers, cookies };
}
function mockRes() {
  const r = { statusCode: 200, headers: {}, data: null };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (d) => { r.data = d; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; return r; };
  return r;
}

// ============================================================================
// 1. CONFIGURATION, ENABLED/DISABLED TOGGLE & TOKEN SECURITY
// ============================================================================
console.log("\n--- 1. Telegram Bot Config & Token Security ---");

// Initial state
const initialConfig = getTelegramConfig();
test("1.1 Read initial Telegram config", initialConfig !== null, `Enabled: ${initialConfig.enabled}`);

// Update config with secret token
const secretToken = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_TEST";
const updatedConfig = updateTelegramConfig({
  enabled: true,
  botToken: secretToken,
});

test("1.2 Update token in server config", updatedConfig.hasToken === true);
test("1.3 Bot token is masked in config output", updatedConfig.botToken === "••••••••••••••••" && !updatedConfig.botToken.includes("ABCdef"));

// Verify direct SQLite row has the raw token stored safely server-side
const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get();
const parsedSettings = JSON.parse(settingsRow.value);
test("1.4 SQLite row securely stores raw token", parsedSettings.telegram.botToken === secretToken);

// 1.4b Admin Authorization Check: Unauthenticated requests to /admin/* must be rejected
import { requireAdminAuth } from "./auth.js";
let authRejected = false;
const unauthReq = mockReq({}, {}, {}, {}, {}); // no cookies or bearer token
const unauthRes = mockRes();
requireAdminAuth(unauthReq, unauthRes, () => {
  authRejected = false;
});
if (unauthRes.statusCode === 401) {
  authRejected = true;
}
test("1.4b Admin auth middleware protects Telegram endpoints (401 Unauthorized)", authRejected === true);

// Update config with disabled toggle
const disabledConfig = updateTelegramConfig({ enabled: false });
test("1.5 Telegram integration disabled toggle", disabledConfig.enabled === false);

// Re-enable Telegram
const reenabledConfig = updateTelegramConfig({ enabled: true });
test("1.6 Telegram integration re-enabled toggle", reenabledConfig.enabled === true);

// ============================================================================
// 2. RECIPIENT CRUD & MULTI-RECIPIENT SYSTEM
// ============================================================================
console.log("\n--- 2. Telegram Recipients CRUD & Multi-Recipient System ---");

// Clean existing test recipients
db.prepare("DELETE FROM telegram_recipients WHERE chat_id LIKE '100200%'").run();

// 2.1 Add Owner Recipient
let ownerRecipient = null;
try {
  ownerRecipient = createTelegramRecipient({
    name: "Олена (Власниця)",
    username: "olena_honey",
    chat_id: "100200301",
    role: "owner",
    is_active: true,
  });
  test("2.1 Add Owner recipient (role: owner)", ownerRecipient && ownerRecipient.role === "owner" && ownerRecipient.username === "@olena_honey", `ID: ${ownerRecipient.id}`);
} catch (err) {
  test("2.1 Add Owner recipient", false, err.message);
}

// 2.2 Add Manager Recipient
let managerRecipient = null;
try {
  managerRecipient = createTelegramRecipient({
    name: "Дмитро (Менеджер)",
    username: "@dmitro_orders",
    chat_id: "100200302",
    role: "manager",
    is_active: true,
  });
  test("2.2 Add Manager recipient (role: manager)", managerRecipient && managerRecipient.role === "manager", `ID: ${managerRecipient.id}`);
} catch (err) {
  test("2.2 Add Manager recipient", false, err.message);
}

// 2.3 Multiple Recipients Fetch
const allRecipients = getTelegramRecipients();
test("2.3 Multiple recipients listed", allRecipients.length >= 2, `Count: ${allRecipients.length}`);

// Role ordering verification (owner first, then manager)
const ownerIndex = allRecipients.findIndex((r) => r.id === ownerRecipient?.id);
const managerIndex = allRecipients.findIndex((r) => r.id === managerRecipient?.id);
test("2.4 Priority role ordering (owner before manager)", ownerIndex !== -1 && managerIndex !== -1 && ownerIndex < managerIndex);

// 2.5 Toggle Recipient Active/Inactive
const toggledOff = toggleTelegramRecipient(managerRecipient.id);
test("2.5 Deactivate recipient", toggledOff.is_active === false);

const toggledOn = toggleTelegramRecipient(managerRecipient.id);
test("2.6 Re-activate recipient", toggledOn.is_active === true);

// 2.7 Update Recipient Details
const updatedManager = updateTelegramRecipient(managerRecipient.id, {
  name: "Дмитро Сергійович (Старший менеджер)",
  username: "dmitro_senior",
});
test("2.7 Update recipient name & username", updatedManager.name.includes("Старший") && updatedManager.username === "@dmitro_senior");

// 2.8 Delete Recipient
const tempRecipient = createTelegramRecipient({
  name: "Тимчасовий отримувач",
  chat_id: "999999999",
  role: "manager",
});
const deleteResult = deleteTelegramRecipient(tempRecipient.id);
const checkDeleted = getTelegramRecipients().find((r) => r.id === tempRecipient.id);
test("2.8 Delete recipient", deleteResult.ok === true && !checkDeleted);

// 2.9 Test Notification to Specific Recipient in SIMULATED mode (no token set)
updateTelegramConfig({ botToken: "" }); // temporarily reset token
const simTestResult = await testRecipientNotification(ownerRecipient.id);
test("2.9 Test notification in simulated mode (no token)", simTestResult.ok === true && simTestResult.simulated === true, simTestResult.message);

// 2.10 Test Notification with Mocked Telegram API response (token configured)
updateTelegramConfig({ botToken: secretToken });
const originalFetch = globalThis.fetch;
let capturedRequests = [];

globalThis.fetch = async (url, options = {}) => {
  capturedRequests.push({ url, options, body: options.body ? JSON.parse(options.body) : null });
  // Telegram Bot API mock response
  if (url.includes("/getMe")) {
    return {
      ok: true,
      json: async () => ({ ok: true, result: { id: 1234567, is_bot: true, first_name: "Honey Bot", username: "honey_pasika_bot" } }),
    };
  }
  if (url.includes("/sendMessage")) {
    return {
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 8899, date: Math.floor(Date.now() / 1000) } }),
    };
  }
  if (url.includes("/editMessageText")) {
    return {
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 8899, text: "Updated" } }),
    };
  }
  if (url.includes("/answerCallbackQuery")) {
    return {
      ok: true,
      json: async () => ({ ok: true, result: true }),
    };
  }
  return {
    ok: true,
    json: async () => ({ ok: true }),
  };
};

const liveMockTestResult = await testRecipientNotification(ownerRecipient.id);
test("2.10 Test notification via Telegram Bot API", liveMockTestResult.ok === true && liveMockTestResult.simulated === false, liveMockTestResult.message);
test("2.11 Correct Chat ID targeted in Telegram API call", capturedRequests.some((r) => r.body?.chat_id === ownerRecipient.chat_id));

// ============================================================================
// 3. TELEGRAM BOT START FLOW & WEBHOOK
// ============================================================================
console.log("\n--- 3. Telegram Bot Start Flow & Webhook ---");

// 3.1 Webhook /start command handling
const startWebhookPayload = {
  update_id: 10001,
  message: {
    message_id: 42,
    from: {
      id: 555666777,
      is_bot: false,
      first_name: "Марія",
      last_name: "Коваленко",
      username: "mariya_honey_app",
    },
    chat: {
      id: 555666777,
      type: "private",
    },
    date: Math.floor(Date.now() / 1000),
    text: "/start",
  },
};

const webhookResult = await handleTelegramWebhook(startWebhookPayload);
test("3.1 Webhook /start command execution", webhookResult.ok === true && webhookResult.type === "start");

// 3.2 Verify interaction saved in recent chats
const recentChats = getRecentTelegramInteractions(10);
const recordedChat = recentChats.find((c) => String(c.chat_id) === "555666777");
test("3.2 Recent /start chats captured for admin panel", Boolean(recordedChat), `User: ${recordedChat?.displayName}, Chat ID: ${recordedChat?.chat_id}`);

// ============================================================================
// 4. ORDER MESSAGE FORMATTING & INLINE BUTTONS (PASIKA SPEC)
// ============================================================================
console.log("\n--- 4. Order Message Formatting & Inline Keyboard ---");

// Insert actual test order into SQLite to satisfy strict database-first architecture
const testOrderId = "o_test_tg_suite";
db.prepare("DELETE FROM order_items WHERE order_id = ?").run(testOrderId);
db.prepare("DELETE FROM orders WHERE id = ?").run(testOrderId);

db.prepare(`
  INSERT INTO orders (
    id, number, status, customer_first_name, customer_last_name,
    customer_phone, customer_email, total, delivery_provider,
    delivery_provider_key, delivery_city_name, delivery_branch_name,
    payment_method, comment, receipt_url, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  testOrderId,
  1088,
  "NEW",
  "Олексій",
  "Шевченко",
  "+380 50 123 45 67",
  "oleksiy@example.com",
  620,
  "Нова Пошта",
  "np",
  "Івано-Франківськ",
  "Відділення №4 (вул. Січових Стрільців)",
  "card",
  "Зателефонуйте перед відправкою, будь ласка",
  "/uploads/receipts/test-receipt.png",
  Date.now(),
  Date.now()
);

db.prepare(`
  INSERT INTO order_items (id, order_id, product_id, name, weight, price, qty)
  VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)
`).run(
  "oi_test_1", testOrderId, "p1", "Мед Липовий", "500 г", 210, 2,
  "oi_test_2", testOrderId, "p3", "Крем-мед з малиною", "250 г", 200, 1
);

const sampleOrder = getFullOrder(testOrderId);

const formattedMsg = formatOrderMessage(sampleOrder);
test("4.1 Message contains official PASIKA header and order number", formattedMsg.includes("🐝 <b>НОВЕ ЗАМОВЛЕННЯ PASIKA</b>") && formattedMsg.includes("#1088"));
test("4.2 Message contains customer name & phone", formattedMsg.includes("Олексій Шевченко") && formattedMsg.includes("+380 50 123 45 67"));
test("4.3 Message contains items breakdown", formattedMsg.includes("Мед Липовий") && formattedMsg.includes("× 2"));
test("4.4 Message contains total sum", formattedMsg.includes("620 грн"));
test("4.5 Message contains delivery details", formattedMsg.includes("Нова Пошта") && formattedMsg.includes("Івано-Франківськ"));
test("4.6 Message contains payment method and receipt status", formattedMsg.includes("Оплата карткою") && formattedMsg.includes("Чек:</b> Додано клієнтом ✅"));

const keyboard = buildOrderInlineKeyboard(sampleOrder);
test("4.7 Inline keyboard has 'Відкрити замовлення' URL button", keyboard.inline_keyboard[0][0].text === "📋 Відкрити замовлення" && keyboard.inline_keyboard[0][0].url.includes(`/admin/orders/${testOrderId}`));
test("4.8 Inline keyboard has 'Прийняти' and 'Відхилити' action buttons", keyboard.inline_keyboard[1][0].callback_data === `order_accept_${testOrderId}` && keyboard.inline_keyboard[1][1].callback_data === `order_reject_${testOrderId}`);

// ============================================================================
// 4B. SECURITY & CALLBACK QUERY EXECUTION
// ============================================================================
console.log("\n--- 4B. Security & Order Action Callbacks ---");

// 4.9 Unauthorized Telegram user attempt (must be blocked!)
const unauthCallbackPayload = {
  update_id: 10002,
  callback_query: {
    id: "cb_unauth",
    from: { id: 999888777, username: "stranger" },
    data: `order_accept_${testOrderId}`,
    message: { chat: { id: 999888777 }, message_id: 101 },
  },
};
const unauthResult = await handleTelegramWebhook(unauthCallbackPayload);
test("4.9 Unauthorized user blocked from modifying order", unauthResult.ok === false, unauthResult.message);

// Check order status in DB remained unchanged (still NEW)
const statusAfterUnauth = db.prepare("SELECT status FROM orders WHERE id = ?").get(testOrderId).status;
test("4.10 Order status unchanged in SQLite after unauthorized attempt", statusAfterUnauth === "NEW");

// 4.11 Authorized Owner clicks 'Прийняти' (Accept)
const acceptCallbackPayload = {
  update_id: 10003,
  callback_query: {
    id: "cb_accept_valid",
    from: { id: 100200301, username: "olena_honey", first_name: "Олена" },
    data: `order_accept_${testOrderId}`,
    message: { chat: { id: 100200301 }, message_id: 102 },
  },
};
const cbAcceptResult = await handleTelegramWebhook(acceptCallbackPayload);
test("4.11 Authorized callback query 'order_accept' succeeds", cbAcceptResult.ok === true && cbAcceptResult.type === "callback_accept");

// Verify SQLite order status changed to PROCESSING
const statusAfterAccept = db.prepare("SELECT status FROM orders WHERE id = ?").get(testOrderId).status;
test("4.12 SQLite main order status changed to 'PROCESSING'", statusAfterAccept === "PROCESSING");

// Admin panel views the updated status
const adminOrderView = getFullOrder(testOrderId);
test("4.13 Admin panel views updated status ('PROCESSING')", adminOrderView.status === "PROCESSING");

// 4.14 Authorized Owner clicks 'Відхилити' (Reject / Cancel)
const rejectCallbackPayload = {
  update_id: 10004,
  callback_query: {
    id: "cb_reject_valid",
    from: { id: 100200301, username: "olena_honey", first_name: "Олена" },
    data: `order_reject_${testOrderId}`,
    message: { chat: { id: 100200301 }, message_id: 102 },
  },
};
const cbRejectResult = await handleTelegramWebhook(rejectCallbackPayload);
test("4.14 Authorized callback query 'order_reject' succeeds", cbRejectResult.ok === true && cbRejectResult.type === "callback_reject");

const statusAfterReject = db.prepare("SELECT status FROM orders WHERE id = ?").get(testOrderId).status;
test("4.15 SQLite main order status changed to 'CANCELLED'", statusAfterReject === "CANCELLED");

// ============================================================================
// 5. ORDER NOTIFICATION DISPATCH (ENABLED, DISABLED, FAILURE TOLERANCE)
// ============================================================================
console.log("\n--- 5. Order Notification Dispatch & Error Handling ---");

capturedRequests = [];
updateTelegramConfig({ enabled: true });
const dispatchResult = await sendOrderTelegramNotification(sampleOrder);
test("5.1 Multi-recipient dispatch sends message to all active recipients", dispatchResult.ok === true && dispatchResult.sentCount === 2, `Sent: ${dispatchResult.sentCount} of ${dispatchResult.total}`);

// Verify logs table
const latestLog = db.prepare("SELECT * FROM telegram_logs WHERE order_id = ? ORDER BY created_at DESC LIMIT 1").get(sampleOrder.id);
test("5.2 Delivery logged in telegram_logs with SENT status", latestLog && latestLog.status === "SENT", `Status: ${latestLog?.status}`);

// 5.3 Telegram Disabled -> Logged as DISABLED, does not send
updateTelegramConfig({ enabled: false });
const disabledDispatch = await sendOrderTelegramNotification(sampleOrder);
test("5.3 Notification skipped when Telegram disabled", disabledDispatch.disabled === true);

const disabledLog = db.prepare("SELECT * FROM telegram_logs ORDER BY created_at DESC LIMIT 1").get();
test("5.4 Disabled event logged in telegram_logs", disabledLog && disabledLog.status === "DISABLED");

// Re-enable for order creation test
updateTelegramConfig({ enabled: true });

// 5.5 Inactive recipient test (deactivated recipient must NOT receive message)
toggleTelegramRecipient(managerRecipient.id); // Deactivate manager
capturedRequests = [];
const singleRecipientDispatch = await sendOrderTelegramNotification(sampleOrder);
test("5.5 Deactivated recipient does not receive notification", singleRecipientDispatch.sentCount === 1, `Sent count: ${singleRecipientDispatch.sentCount}`);
toggleTelegramRecipient(managerRecipient.id); // Re-activate manager

// 5.6 Telegram API Failure Resilience: If Telegram API throws or returns 500/401, order creation MUST succeed!
globalThis.fetch = async () => {
  throw new Error("Telegram API Network Timeout (504)");
};

const failedDispatch = await sendOrderTelegramNotification(sampleOrder);
test("5.6 Service catches Telegram API failures gracefully", failedDispatch.failedCount > 0);

const failedLog = db.prepare("SELECT * FROM telegram_logs WHERE text LIKE '%1088%' ORDER BY created_at DESC LIMIT 1").get();
test("5.7 Failure accurately recorded in telegram_logs", failedLog && failedLog.status === "FAILED");

// 5.8 Checkout Resilience Test (Client creates order, Telegram fails, order created anyway)
const newOrderReq = mockReq({
  firstName: "Тетяна",
  lastName: "Франко",
  phone: "+380 67 111 22 33",
  email: "franko@example.com",
  providerKey: "np_branch",
  city: "Львів",
  branch: "Відділення №1",
  paymentMethod: "cod",
  comment: "Тестове замовлення для перевірки Telegram стійкості",
  items: [{ id: "p1", qty: 1 }],
});

const newOrderRes = mockRes();
await createOrder(newOrderReq, newOrderRes);
test("5.8 Order creation succeeds even when Telegram network fails completely", newOrderRes.statusCode === 201 && newOrderRes.data?.success === true, `Order #${newOrderRes.data?.order?.number}`);

// Verify order is in SQLite database
const createdOrderId = newOrderRes.data?.order?.id;
const verifiedInDb = db.prepare("SELECT * FROM orders WHERE id = ?").get(createdOrderId);
test("5.9 New order is committed in SQLite DB", Boolean(verifiedInDb));

// Verify order is visible in Admin
const verifiedInAdmin = getFullOrder(createdOrderId);
test("5.10 New order is visible in Admin", Boolean(verifiedInAdmin && verifiedInAdmin.id === createdOrderId));

// Restore fetch
globalThis.fetch = originalFetch;

// ============================================================================
// CLEANUP
// ============================================================================
// Clean up test orders from DB
if (createdOrderId) {
  db.prepare("DELETE FROM order_items WHERE order_id = ?").run(createdOrderId);
  db.prepare("DELETE FROM orders WHERE id = ?").run(createdOrderId);
  db.prepare("UPDATE products SET stock = stock + 1 WHERE id = 'p1'").run();
}

db.prepare("DELETE FROM order_items WHERE order_id = ?").run(testOrderId);
db.prepare("DELETE FROM orders WHERE id = ?").run(testOrderId);

// Clean up test recipients
db.prepare("DELETE FROM telegram_recipients WHERE id = ?").run(ownerRecipient.id);
db.prepare("DELETE FROM telegram_recipients WHERE id = ?").run(managerRecipient.id);

// Reset config back to clean unconfigured state for the user
updateTelegramConfig({
  enabled: true,
  botToken: "",
});

// ============================================================================
// 6. SUMMARY
// ============================================================================
const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = total - passed;

console.log("\n==================================================");
console.log(`TOTAL TELEGRAM TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
