import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { initDatabase, db, normalizePhone, DB_PATH } from "./db.js";
import {
  createOrder,
  getFullOrder,
  updateOrderStatus,
  updateOrderTracking,
  softDeleteOrder,
  restoreOrder,
  getAdminOrders,
} from "./orders.js";
import { getAdminCustomers, getAdminCustomerById } from "./customers.js";
import { getDashboardStats } from "./products.js";
import { createBackupFile, listBackups } from "./backup.js";

console.log("==================================================================");
console.log("🐝 PASIKA DATA PERSISTENCE, DEDUPLICATION & TRACKING TEST SUITE");
console.log("==================================================================\n");

initDatabase();

const results = [];
function test(name, passed, details = "") {
  results.push({ name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} : ${name}${details ? ` -> ${details}` : ""}`);
}

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

async function runTests() {
  // ============================================================================
  // TEST 1: DATA PERSISTENCE ACROSS SERVER RESTART / DB RE-INIT
  // ============================================================================
  console.log("\n--- TEST 1: Data Persistence Across Restart / Re-Init ---");
  const testOrderId = `test_persist_${Date.now()}`;
  const req1 = mockReq({
    firstName: "Олена",
    lastName: "Петренко",
    phone: "+380501112233",
    email: "olena@example.com",
    city: "Львів",
    branch: "Відділення №5",
    providerKey: "np",
    paymentMethod: "cod",
    items: [{ id: "p1", qty: 2 }],
  });
  const res1 = mockRes();
  await createOrder(req1, res1);
  const createdOrder = res1.data?.order;
  test("1.1 Order created successfully in SQLite", Boolean(createdOrder?.id), `Order ID: ${createdOrder?.id}, Total: ${createdOrder?.total}`);

  // Simulate server restart: re-initialize database and query from disk
  initDatabase();
  const diskCheck = db.prepare("SELECT * FROM orders WHERE id = ?").get(createdOrder.id);
  test("1.2 Order persists in database after re-init (no data loss)", diskCheck !== undefined && diskCheck.total === createdOrder.total, `Found on disk: #${diskCheck?.number}, Total: ${diskCheck?.total} грн`);

  // ============================================================================
  // TEST 2: CUSTOMER DEDUPLICATION BY NORMALIZED PHONE
  // ============================================================================
  console.log("\n--- TEST 2: Customer Deduplication by Phone ---");
  // Normalize phone tests
  const testPhoneRaw1 = "067 999 88 77";
  const testPhoneRaw2 = "+38 (067) 999-88-77";
  const normalized1 = normalizePhone(testPhoneRaw1);
  const normalized2 = normalizePhone(testPhoneRaw2);
  test("2.1 Phone normalizer produces canonical +380XXXXXXXXX", normalized1 === "+380679998877" && normalized2 === "+380679998877", `Normalized: ${normalized1}`);

  // Order A with raw phone format 1
  const reqDedupA = mockReq({
    firstName: "Михайло",
    lastName: "Коваль",
    phone: testPhoneRaw1,
    city: "Івано-Франківськ",
    branch: "Відділення №1",
    providerKey: "np",
    paymentMethod: "cod",
    items: [{ id: "p1", qty: 1 }],
  });
  const resDedupA = mockRes();
  await createOrder(reqDedupA, resDedupA);
  const orderA = resDedupA.data?.order;

  // Order B with raw phone format 2
  const reqDedupB = mockReq({
    firstName: "Михайло",
    lastName: "Коваль",
    phone: testPhoneRaw2,
    city: "Івано-Франківськ",
    branch: "Відділення №2",
    providerKey: "np",
    paymentMethod: "cod",
    items: [{ id: "p2", qty: 1 }],
  });
  const resDedupB = mockRes();
  await createOrder(reqDedupB, resDedupB);
  const orderB = resDedupB.data?.order;

  // Check customers table
  const customerRows = db.prepare("SELECT * FROM customers WHERE phone = ?").all(normalized1);
  test("2.2 Exactly 1 customer record exists for 2 orders with same phone", customerRows.length === 1, `Customer rows: ${customerRows.length}, ID: ${customerRows[0]?.id}`);

  const customerRecord = customerRows[0];
  test("2.3 Customer total_orders = 2 and total_spent is accumulated", customerRecord?.total_orders === 2 && customerRecord?.total_spent === (orderA.total + orderB.total), `total_orders: ${customerRecord?.total_orders}, total_spent: ${customerRecord?.total_spent} грн`);

  // Verify getAdminCustomerById returns customer profile with orders
  const reqCust = mockReq({}, { id: customerRecord.id });
  const resCust = mockRes();
  getAdminCustomerById(reqCust, resCust);
  test("2.4 Customer profile returns all associated orders", Array.isArray(resCust.data?.orders) && resCust.data.orders.length >= 2, `Customer orders count: ${resCust.data?.orders?.length}`);

  // ============================================================================
  // TEST 3: DASHBOARD STATS COMPUTED DIRECTLY FROM SQLITE DB
  // ============================================================================
  console.log("\n--- TEST 3: Dashboard Stats from Database ---");
  const reqDash = mockReq();
  const resDash = mockRes();
  getDashboardStats(reqDash, resDash);
  const stats = resDash.data;
  test("3.1 Dashboard stats returns valid DB metrics", stats !== null && stats.kpis !== undefined, `KPIs present`);
  test("3.2 Total orders and customers are positive numbers from DB", stats.kpis.totalOrders > 0 && stats.kpis.totalCustomers > 0, `Total Orders: ${stats.kpis.totalOrders}, Total Customers: ${stats.kpis.totalCustomers}`);
  test("3.3 Financial KPIs computed directly via SQL", stats.kpis.totalRevenue >= 0 && stats.kpis.averageCheck >= 0, `Total Revenue: ${stats.kpis.totalRevenue} грн, Avg Check: ${stats.kpis.averageCheck} грн`);
  test("3.4 Customers segmentation (new vs repeat) calculated", stats.kpis.repeatCustomers >= 1, `Repeat Customers: ${stats.kpis.repeatCustomers}, New Customers: ${stats.kpis.newCustomers}`);

  // ============================================================================
  // TEST 4: SOFT DELETE & RESTORE FOR ORDERS
  // ============================================================================
  console.log("\n--- TEST 4: Soft Delete & Restore Flow ---");
  // Soft delete order A
  const reqDel = mockReq({}, { id: orderA.id });
  const resDel = mockRes();
  softDeleteOrder(reqDel, resDel);
  test("4.1 Soft delete returns success", resDel.statusCode === 200 && resDel.data?.success === true, `Order ${orderA.id} soft deleted`);

  // Check order is not deleted physically in SQLite
  const dbOrderDeleted = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderA.id);
  test("4.2 Order record still exists in SQLite with deleted_at NOT NULL", dbOrderDeleted !== undefined && dbOrderDeleted.deleted_at !== null, `deleted_at: ${dbOrderDeleted?.deleted_at}`);

  // Verify getAdminOrders excludes soft deleted orders by default
  const reqListActive = mockReq({}, {}, {});
  const resListActive = mockRes();
  getAdminOrders(reqListActive, resListActive);
  const activeOrders = resListActive.data;
  const isFoundInActive = activeOrders.some((o) => o.id === orderA.id);
  test("4.3 Soft deleted order is hidden from default orders list", !isFoundInActive, `Order ${orderA.id} not in active orders`);

  // Verify getAdminOrders with ?deleted=true includes soft deleted orders
  const reqListTrash = mockReq({}, {}, { deleted: "true" });
  const resListTrash = mockRes();
  getAdminOrders(reqListTrash, resListTrash);
  const trashOrders = resListTrash.data;
  const isFoundInTrash = trashOrders.some((o) => o.id === orderA.id);
  test("4.4 Soft deleted order is visible in trash (?deleted=true)", isFoundInTrash, `Order ${orderA.id} found in trash list`);

  // Restore order A
  const reqRestore = mockReq({}, { id: orderA.id });
  const resRestore = mockRes();
  restoreOrder(reqRestore, resRestore);
  test("4.5 Restore order returns success", resRestore.statusCode === 200 && resRestore.data?.success === true, `Order ${orderA.id} restored`);

  const dbOrderRestored = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderA.id);
  test("4.6 Order deleted_at is reset to NULL upon restore", dbOrderRestored?.deleted_at === null, `deleted_at after restore: ${dbOrderRestored?.deleted_at}`);

  // ============================================================================
  // TEST 5: ORDER STATUS HISTORY TRAIL
  // ============================================================================
  console.log("\n--- TEST 5: Status History Trail ---");
  // Change status to PROCESSING
  const reqStat1 = mockReq({ status: "PROCESSING", comment: "Замовлення прийнято в роботу" }, { id: orderB.id });
  const resStat1 = mockRes();
  await updateOrderStatus(reqStat1, resStat1);
  test("5.1 Order status updated to PROCESSING", resStat1.data?.status === "PROCESSING", `Status: ${resStat1.data?.status}`);

  // Change status to PACKED
  const reqStat2 = mockReq({ status: "PACKED", comment: "Упаковано в крафтову коробку" }, { id: orderB.id });
  const resStat2 = mockRes();
  await updateOrderStatus(reqStat2, resStat2);
  test("5.2 Order status updated to PACKED", resStat2.data?.status === "PACKED", `Status: ${resStat2.data?.status}`);

  // Verify status history entries in SQLite
  const historyEntries = db.prepare("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC").all(orderB.id);
  test("5.3 Status history logs each transition in SQLite", historyEntries.length >= 3, `History entries count: ${historyEntries.length}`);
  const lastEntry = historyEntries[historyEntries.length - 1];
  test("5.4 Last status transition recorded correctly with comment and changed_by", lastEntry?.to_status === "PACKED" && lastEntry?.comment === "Упаковано в крафтову коробку", `from: ${lastEntry?.from_status} -> to: ${lastEntry?.to_status}, by: ${lastEntry?.changed_by}, comment: ${lastEntry?.comment}`);

  // Verify getFullOrder returns statusHistory
  const fullOrderB = getFullOrder(orderB.id);
  test("5.5 getFullOrder returns complete statusHistory array", Array.isArray(fullOrderB?.statusHistory) && fullOrderB.statusHistory.length >= 3, `Returned history length: ${fullOrderB?.statusHistory?.length}`);

  // ============================================================================
  // TEST 6: TTN DELIVERY TRACKING FLOW & CARRIER LINKS
  // ============================================================================
  console.log("\n--- TEST 6: TTN Tracking Flow & Carrier Links ---");
  const testTtnNP = "20450987654321";
  const reqTrackingNP = mockReq({
    trackingNumber: testTtnNP,
    deliveryService: "Нова пошта",
  }, { id: orderB.id });
  const resTrackingNP = mockRes();
  await updateOrderTracking(reqTrackingNP, resTrackingNP);
  const updatedNP = resTrackingNP.data;

  test("6.1 Adding TTN updates order status to SHIPPED automatically", updatedNP?.status === "SHIPPED", `Status: ${updatedNP?.status}`);
  test("6.2 TTN tracking number and delivery service saved", updatedNP?.delivery?.trackingNumber === testTtnNP && updatedNP?.delivery?.deliveryService === "Нова пошта", `TTN: ${updatedNP?.delivery?.trackingNumber}, Service: ${updatedNP?.delivery?.deliveryService}`);
  test("6.3 Shipped timestamp is automatically set", updatedNP?.delivery?.shippedAt !== null, `Shipped at: ${updatedNP?.delivery?.shippedAt}`);
  test("6.4 Nova Poshta tracking URL formed correctly", updatedNP?.delivery?.trackingUrl === `https://novaposhta.ua/tracking/?cargo_number=${testTtnNP}`, `URL: ${updatedNP?.delivery?.trackingUrl}`);

  // Test Ukrposhta tracking URL
  const testTtnUP = "0500123456789";
  const reqTrackingUP = mockReq({
    trackingNumber: testTtnUP,
    deliveryService: "Укрпошта",
  }, { id: orderB.id });
  const resTrackingUP = mockRes();
  await updateOrderTracking(reqTrackingUP, resTrackingUP);
  const updatedUP = resTrackingUP.data;
  test("6.5 Ukrposhta tracking URL formed correctly", updatedUP?.delivery?.trackingUrl === `https://track.ukrposhta.ua/tracking_UA.html?barcode=${testTtnUP}`, `URL: ${updatedUP?.delivery?.trackingUrl}`);

  // ============================================================================
  // TEST 7: DATABASE BACKUP SUBSYSTEM
  // ============================================================================
  console.log("\n--- TEST 7: Database Backup Subsystem ---");
  const backupResult = await createBackupFile();
  test("7.1 Online SQLite backup creates valid file", backupResult?.success === true && fs.existsSync(backupResult.filePath), `File: ${backupResult?.filename}, Size: ${backupResult?.sizeFormatted}`);

  // Test opening the backup file with better-sqlite3 to verify consistency
  const backupDb = new Database(backupResult.filePath);
  const backupOrdersCount = backupDb.prepare("SELECT count(*) as count FROM orders").get();
  backupDb.close();
  test("7.2 Backup file is a valid, readable SQLite database with all tables and data", backupOrdersCount?.count > 0, `Orders in backup: ${backupOrdersCount?.count}`);

  const backupsList = listBackups();
  test("7.3 listBackups returns existing backups with metadata", backupsList.length > 0 && backupsList[0].filename === backupResult.filename, `Backups count: ${backupsList.length}`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n==================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`TOTAL TESTS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);
  console.log("==================================================");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
