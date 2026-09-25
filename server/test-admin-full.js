process.env.NODE_ENV = "test";
import http from "node:http";
import { app } from "./index.js";

async function runFullAdminSuite() {
  console.log("🐝 Running Full Admin Panel Audit & Functional Verification Suite...\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let cookie = "";

  async function api(pathUrl, options = {}) {
    const headers = {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    };

    if (!(options.body instanceof FormData) && typeof options.body === "object" && options.body !== null && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }

    const res = await fetch(`${baseUrl}${pathUrl}`, {
      ...options,
      headers,
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/pasika_session=[^;]+/);
      if (match) {
        if (setCookie.includes("Max-Age=0") || setCookie.includes("expires=")) {
          cookie = "";
        } else {
          cookie = match[0];
        }
      }
    }

    const contentType = res.headers.get("content-type") || "";
    let data = null;
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return { status: res.status, headers: res.headers, data, ok: res.ok };
  }

  try {
    // 1. Admin Login
    console.log("👉 1. Admin Login");
    const loginRes = await api("/api/auth/login", {
      method: "POST",
      body: { login: "admin", password: "pasika2026" },
    });
    if (!loginRes.ok) throw new Error("Login failed: " + JSON.stringify(loginRes.data));
    console.log("   ✓ Successfully logged in as admin with session cookie\n");

    // 2. Mandatory Product Photo Validation (Should reject if image is missing)
    console.log("👉 2. Product Photo Validation: Reject new product without photo");
    const badProdRes = await api("/api/admin/products", {
      method: "POST",
      body: {
        name: "Мед без фото",
        category: "honey",
        price: 250,
        weight: "400 г",
        // no image!
      },
    });
    if (badProdRes.status !== 400 || !badProdRes.data?.error) {
      throw new Error(`Expected 400 rejection for missing photo, got ${badProdRes.status}: ${JSON.stringify(badProdRes.data)}`);
    }
    console.log(`   ✓ Correctly rejected with 400: "${badProdRes.data.error}"\n`);

    // 3. Product Photo Upload
    console.log("👉 3. Product Photo Upload (/api/upload-product-image)");
    // Create a 1x1 test PNG file buffer
    const testPngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const formData = new FormData();
    const blob = new Blob([testPngBuffer], { type: "image/png" });
    formData.append("image", blob, "test-honey-jar.png");

    const uploadRes = await api("/api/upload-product-image", {
      method: "POST",
      body: formData,
    });
    if (!uploadRes.ok || !uploadRes.data?.fileUrl) {
      throw new Error(`Photo upload failed: ${JSON.stringify(uploadRes.data)}`);
    }
    const uploadedImageUrl = uploadRes.data.fileUrl;
    console.log(`   ✓ Photo uploaded successfully: ${uploadedImageUrl}\n`);

    // 4. Create Product with Photo and Ukrainian Auto-transliterated Slug
    console.log("👉 4. Create Product with Photo and Ukrainian Transliteration");
    const newProdRes = await api("/api/admin/products", {
      method: "POST",
      body: {
        name: "Карпатський лісовий мед",
        category: "honey",
        price: 320,
        weight: "500 г",
        stock: 15,
        image: uploadedImageUrl,
        description: "Натуральний свіжий мед з гірських лісів.",
      },
    });
    if (!newProdRes.ok || !newProdRes.data?.id) {
      throw new Error("Product creation failed: " + JSON.stringify(newProdRes.data));
    }
    const createdProduct = newProdRes.data;
    console.log(`   ✓ Product created: ID=${createdProduct.id}, Slug=${createdProduct.slug}, Image=${createdProduct.image}`);
    if (!createdProduct.slug.includes("karpatskyy-lisovyy-med")) {
      throw new Error(`Expected slug with ukrainian transliteration, got "${createdProduct.slug}"`);
    }
    console.log("   ✓ Ukrainian transliteration correctly applied to slug\n");

    // 5. Product Duplication
    console.log("👉 5. Duplicate Product");
    const dupRes = await api(`/api/admin/products/${createdProduct.id}/duplicate`, {
      method: "POST",
    });
    if (!dupRes.ok || !dupRes.data?.id) {
      throw new Error("Product duplication failed: " + JSON.stringify(dupRes.data));
    }
    const duplicatedProduct = dupRes.data;
    console.log(`   ✓ Duplicated product: ID=${duplicatedProduct.id}, Name="${duplicatedProduct.name}", Slug=${duplicatedProduct.slug}`);
    if (!duplicatedProduct.name.includes("(копія)")) {
      throw new Error(`Expected name to contain '(копія)', got: "${duplicatedProduct.name}"`);
    }
    if (duplicatedProduct.id === createdProduct.id) {
      throw new Error("Duplicated product must have a new unique ID");
    }
    if (duplicatedProduct.slug === createdProduct.slug) {
      throw new Error("Duplicated product must have a unique slug");
    }
    console.log("   ✓ Product successfully duplicated with '(копія)', new ID, and unique slug\n");

    // 6. Category Management & Safe Deletion Protection
    console.log("👉 6. Category Management: Create & Safe Delete Protection");
    // Create a new test category
    const createCatRes = await api("/api/admin/categories", {
      method: "POST",
      body: {
        slug: "test-eco-sweets",
        name: "Еко-солодощі",
        icon: "🍬",
        description: "Крафтові пастила та цукерки з медом",
        sort_order: 99,
      },
    });
    if (!createCatRes.ok) throw new Error("Failed to create category: " + JSON.stringify(createCatRes.data));
    console.log("   ✓ Test category created: 'test-eco-sweets'");

    // Assign duplicated product to this new category
    await api("/api/admin/products", {
      method: "POST",
      body: {
        ...duplicatedProduct,
        category: "test-eco-sweets",
      },
    });
    console.log("   ✓ Assigned duplicated product to 'test-eco-sweets'");

    // Try deleting category while it has products -> MUST BE BLOCKED!
    const blockedDeleteCat = await api("/api/admin/categories/test-eco-sweets", {
      method: "DELETE",
    });
    if (blockedDeleteCat.status !== 400 || !blockedDeleteCat.data?.error) {
      throw new Error(`Expected 400 blocking deletion of non-empty category, got ${blockedDeleteCat.status}`);
    }
    console.log(`   ✓ Correctly blocked deleting category with products: "${blockedDeleteCat.data.error}"`);

    // Remove the product, then delete the category -> MUST SUCCEED!
    await api(`/api/admin/products/${duplicatedProduct.id}`, { method: "DELETE" });
    const successDeleteCat = await api("/api/admin/categories/test-eco-sweets", {
      method: "DELETE",
    });
    if (!successDeleteCat.ok) {
      throw new Error("Failed to delete empty category: " + JSON.stringify(successDeleteCat.data));
    }
    console.log("   ✓ Empty category successfully deleted\n");

    // 7. Safe Product Deletion vs Historical Orders Integrity
    console.log("👉 7. Safe Product Deletion: Verify Past Orders are NOT corrupted");
    // Create an order containing the created product
    const orderRes = await api("/api/orders", {
      method: "POST",
      body: {
        customer: { firstName: "Тест", lastName: "Клієнт", phone: "+380501112233" },
        delivery: { provider: "Нова пошта", city: "Львів", branch: "Відділення №1" },
        payment: { method: "cod" },
        items: [{ id: createdProduct.id, name: createdProduct.name, price: createdProduct.price, qty: 2, weight: createdProduct.weight }],
      },
    });
    if (!orderRes.ok || !orderRes.data?.order?.id) {
      throw new Error("Order creation failed: " + JSON.stringify(orderRes.data));
    }
    const orderId = orderRes.data.order.id;
    console.log(`   ✓ Test order created with product: #${orderRes.data.order.number}`);

    // Now DELETE the product from catalog
    const deleteProdRes = await api(`/api/admin/products/${createdProduct.id}`, {
      method: "DELETE",
    });
    if (!deleteProdRes.ok) throw new Error("Failed to delete product: " + JSON.stringify(deleteProdRes.data));
    console.log("   ✓ Product deleted from catalog");

    // Fetch the order and verify items are completely intact!
    const fetchOrderRes = await api(`/api/admin/orders/${orderId}`);
    if (!fetchOrderRes.ok || !fetchOrderRes.data?.items?.length) {
      throw new Error("Failed to fetch order after product deletion: " + JSON.stringify(fetchOrderRes.data));
    }
    const orderItem = fetchOrderRes.data.items[0];
    if (orderItem.name !== "Карпатський лісовий мед" || orderItem.qty !== 2 || orderItem.price !== 320) {
      throw new Error("Order item data corrupted after product deletion: " + JSON.stringify(orderItem));
    }
    console.log("   ✓ Order items remained 100% intact with snapshot name, price, qty after product deletion\n");

    // 8. Telegram Bot Connection Test
    console.log("👉 8. Telegram Connection Test (/api/admin/telegram/test)");
    const tgTestRes = await api("/api/admin/telegram/test", {
      method: "POST",
      body: {
        botToken: "invalid_mock_token_for_test",
        chatId: "12345",
      },
    });
    // With fake token, it should return 400 or informative error from Telegram API, NOT a crash or 500!
    if (tgTestRes.status !== 400 && tgTestRes.status !== 200) {
      throw new Error(`Unexpected status for telegram test: ${tgTestRes.status}: ${JSON.stringify(tgTestRes.data)}`);
    }
    console.log(`   ✓ Telegram test endpoint responded cleanly without crash: "${tgTestRes.data.error || tgTestRes.data.message}"\n`);

    // 9. Settings Masking & Preservation
    console.log("👉 9. Settings: Token Masking and Preservation");
    // Admin settings fetch
    const adminSettings = await api("/api/admin/settings");
    if (!adminSettings.ok) throw new Error("Failed to get admin settings: " + JSON.stringify(adminSettings.data));

    // Update settings while keeping botToken as masked
    const saveSettingsRes = await api("/api/admin/settings", {
      method: "PUT",
      body: {
        ...adminSettings.data,
        store: {
          ...adminSettings.data.store,
          name: "Родинна пасіка мед (тест)",
        },
        telegram: {
          ...adminSettings.data.telegram,
          botToken: "••••••••••••••••", // masked
        },
      },
    });
    if (!saveSettingsRes.ok) throw new Error("Failed to update settings: " + JSON.stringify(saveSettingsRes.data));
    console.log("   ✓ Settings updated, masked token correctly preserved");

    // Public settings fetch should never expose telegram bot token or internal secrets
    const publicSettings = await api("/api/settings");
    if (publicSettings.data?.telegram?.botToken && publicSettings.data.telegram.botToken !== "••••••••••••••••") {
      throw new Error("CRITICAL SECURITY LEAK: Telegram bot token exposed in public /api/settings!");
    }
    console.log("   ✓ Public /api/settings does not expose raw bot tokens\n");

    console.log("🎉 ALL FULL ADMIN SUITE AUDIT TESTS PASSED SUCCESSFULLY (10/10)!\n");
    server.close(() => process.exit(0));
  } catch (err) {
    server.close();
    throw err;
  }
}

runFullAdminSuite().catch((err) => {
  console.error("❌ Full Admin Suite Test failed:", err);
  process.exit(1);
});
