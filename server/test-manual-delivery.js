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

console.log(`🧪 Testing Manual Delivery Checkout step against ${BASE_URL}...\n`);

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
  // ----------------------------------------------------
  // TEST 1: Validation Logic Simulation
  // ----------------------------------------------------
  console.log("👉 Test 1: Step 2 Validation Logic (pure client-side, zero API)");

  const isStep2Valid = (form) => Boolean(
    form.providerKey &&
    form.deliveryCity.trim() &&
    form.deliveryRegion.trim() &&
    form.deliveryBranch.trim()
  );

  const formState = {
    providerKey: "np",
    deliveryCity: "",
    deliveryRegion: "",
    deliveryBranch: "",
  };

  assert.strictEqual(isStep2Valid(formState), false, "Empty fields must be invalid");

  formState.deliveryCity = "Коростень";
  assert.strictEqual(isStep2Valid(formState), false, "Missing region and branch must be invalid");

  formState.deliveryRegion = "Житомирська";
  assert.strictEqual(isStep2Valid(formState), false, "Missing branch must be invalid");

  formState.deliveryBranch = "5";
  assert.strictEqual(isStep2Valid(formState), true, "Коростень + Житомирська + 5 with NP must be valid!");
  console.log("   ✓ Form validates 'Коростень' + 'Житомирська' + '5' with 'Нова пошта' -> step2Valid: true (Zero API needed)");

  // Switch to Ukrposhta
  formState.providerKey = "up";
  assert.strictEqual(isStep2Valid(formState), true, "Switching to Ukrposhta retains validity");
  console.log("   ✓ Form validates 'Коростень' + 'Житомирська' + '5' with 'Укрпошта' -> step2Valid: true (Zero API needed)");

  // ----------------------------------------------------
  // TEST 2: Order Creation via Nova Poshta (Korosten, 5)
  // ----------------------------------------------------
  console.log("\n👉 Test 2: Order submission with Nova Poshta (Коростень, Відділення №5)");

  const npOrderPayload = {
    firstName: "Олексій",
    lastName: "Бондар",
    phone: "+380 97 123 45 67",
    email: "oleksiy@example.com",
    providerKey: "np",
    deliveryCity: "Коростень",
    deliveryRegion: "Житомирська",
    deliveryBranch: "5",
    city: "Коростень (Житомирська)",
    branch: "Відділення №5",
    paymentMethod: "cod",
    items: [{ id: "p1", qty: 1 }],
    idempotencyKey: `test_np_${Date.now()}`,
    checkoutToken: `chk_np_${Date.now()}`,
  };

  const npRes = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(npOrderPayload),
  });

  assert.ok(npRes.status === 200 || npRes.status === 201, `Expected 200 or 201, got ${npRes.status}`);
  assert.ok(npRes.data.order, "Order must be returned");
  assert.strictEqual(npRes.data.order.delivery.provider, "Нова пошта");
  assert.strictEqual(npRes.data.order.delivery.city, "Коростень (Житомирська)");
  assert.strictEqual(npRes.data.order.delivery.branch, "Відділення №5");
  console.log(`   ✓ Created NP Order #${npRes.data.order.number}:`);
  console.log(`     - Служба: ${npRes.data.order.delivery.provider}`);
  console.log(`     - Місто: ${npRes.data.order.delivery.city}`);
  console.log(`     - Відділення: ${npRes.data.order.delivery.branch}`);

  // ----------------------------------------------------
  // TEST 3: Order Creation via Ukrposhta (Korosten, Відділення 11500)
  // ----------------------------------------------------
  console.log("\n👉 Test 3: Order submission with Ukrposhta (Коростень, Відділення 11500)");

  const upOrderPayload = {
    firstName: "Тетяна",
    lastName: "Мельник",
    phone: "+380 66 987 65 43",
    email: "tetiana@example.com",
    providerKey: "up",
    deliveryCity: "Коростень",
    deliveryRegion: "Житомирська",
    deliveryBranch: "Відділення 11500",
    city: "Коростень (Житомирська)",
    branch: "Відділення 11500",
    paymentMethod: "cod",
    items: [{ id: "p2", qty: 1 }],
    idempotencyKey: `test_up_${Date.now()}`,
    checkoutToken: `chk_up_${Date.now()}`,
  };

  const upRes = await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(upOrderPayload),
  });

  assert.ok(upRes.status === 200 || upRes.status === 201, `Expected 200 or 201, got ${upRes.status}`);
  assert.ok(upRes.data.order, "Order must be returned");
  assert.strictEqual(upRes.data.order.delivery.provider, "Укрпошта");
  assert.strictEqual(upRes.data.order.delivery.city, "Коростень (Житомирська)");
  assert.strictEqual(upRes.data.order.delivery.branch, "Відділення 11500");
  console.log(`   ✓ Created UP Order #${upRes.data.order.number}:`);
  console.log(`     - Служба: ${upRes.data.order.delivery.provider}`);
  console.log(`     - Місто: ${upRes.data.order.delivery.city}`);
  console.log(`     - Відділення: ${upRes.data.order.delivery.branch}`);

  console.log("\n🎉 ALL MANUAL DELIVERY TESTS PASSED WITH 100% SUCCESS!");
} finally {
  server.close();
}
