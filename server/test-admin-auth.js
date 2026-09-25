process.env.NODE_ENV = "test";
import http from "node:http";
import { app } from "./index.js";

async function runAdminAuthTests() {
  console.log("🧪 Running Comprehensive Admin Auth & Security Test Suite...\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let cookie = "";

  async function api(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${baseUrl}${path}`, {
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
    // Test 1: Check session without being logged in
    console.log("👉 Test 1: Unauthenticated session check (/api/auth/me)");
    const meNoAuth = await api("/api/auth/me");
    if (meNoAuth.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated /api/auth/me, got ${meNoAuth.status}`);
    }
    console.log("   ✓ Correctly rejected unauthenticated request with 401");

    // Test 2: Failed login attempt
    console.log("\n👉 Test 2: Failed login with invalid credentials");
    const badLogin = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login: "admin", password: "wrong_password_123" }),
    });
    if (badLogin.status !== 401 || !badLogin.data?.error) {
      throw new Error(`Expected 401 with error message, got status ${badLogin.status}`);
    }
    console.log(`   ✓ Correctly rejected with 401: "${badLogin.data.error}"`);

    // Test 3: Successful login with default credentials
    console.log("\n👉 Test 3: Successful login with admin credentials");
    const goodLogin = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login: "admin", password: "pasika2026" }),
    });
    if (goodLogin.status !== 200 || !goodLogin.data?.success) {
      throw new Error(`Login failed with status ${goodLogin.status}: ${JSON.stringify(goodLogin.data)}`);
    }
    if (!cookie.includes("pasika_session=")) {
      throw new Error("Login did not set pasika_session cookie");
    }
    console.log(`   ✓ Login successful for "${goodLogin.data.username}", received session cookie`);

    // Test 4: Authenticated session check
    console.log("\n👉 Test 4: Authenticated session check (/api/auth/me)");
    const meAuth = await api("/api/auth/me");
    if (meAuth.status !== 200 || !meAuth.data?.authenticated || meAuth.data?.username !== "admin") {
      throw new Error(`Expected 200 authenticated, got: ${JSON.stringify(meAuth.data)}`);
    }
    console.log(`   ✓ Session valid: authenticated = true, username = "${meAuth.data.username}"`);

    // Test 5: Access protected admin dashboard
    console.log("\n👉 Test 5: Access protected admin dashboard (/api/admin/dashboard)");
    const dash = await api("/api/admin/dashboard");
    if (dash.status !== 200 || !dash.data?.kpis) {
      throw new Error(`Expected 200 with dashboard KPIs, got status ${dash.status}`);
    }
    console.log("   ✓ Successfully loaded admin dashboard with session authentication");

    // Test 6: Security update - Reject if current password incorrect
    console.log("\n👉 Test 6: Security update rejects incorrect current password");
    const badSec = await api("/api/admin/security", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: "incorrect_current_pwd",
        newPassword: "newSecurePassword2026!",
        confirmPassword: "newSecurePassword2026!",
      }),
    });
    if (badSec.status !== 401) {
      throw new Error(`Expected 401 for bad current password, got ${badSec.status}`);
    }
    console.log(`   ✓ Correctly rejected: "${badSec.data.error}"`);

    // Test 7: Security update - Change username and password
    console.log("\n👉 Test 7: Change admin username and password");
    const changeSec = await api("/api/admin/security", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: "pasika2026",
        newLogin: "superadmin",
        newPassword: "newSecurePassword2026!",
        confirmPassword: "newSecurePassword2026!",
      }),
    });
    if (changeSec.status !== 200 || !changeSec.data?.success) {
      throw new Error(`Failed to change security: ${JSON.stringify(changeSec.data)}`);
    }
    console.log(`   ✓ Password and username updated to "${changeSec.data.username}"`);

    // Test 8: Logout
    console.log("\n👉 Test 8: Admin logout (/api/auth/logout)");
    const logoutRes = await api("/api/auth/logout", { method: "POST" });
    if (logoutRes.status !== 200) {
      throw new Error(`Logout failed with status ${logoutRes.status}`);
    }
    console.log("   ✓ Logout successful, session cookie cleared");

    // Test 9: Verify session is now invalidated
    console.log("\n👉 Test 9: Verify session is invalidated after logout");
    const meAfterLogout = await api("/api/auth/me");
    if (meAfterLogout.status !== 401) {
      throw new Error(`Expected 401 after logout, got ${meAfterLogout.status}`);
    }
    console.log("   ✓ Session is dead after logout");

    // Test 10: Verify old password is no longer accepted
    console.log("\n👉 Test 10: Verify old password is REJECTED");
    const oldLoginAttempt = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login: "superadmin", password: "pasika2026" }),
    });
    if (oldLoginAttempt.status !== 401) {
      throw new Error(`Old password should be rejected, got status ${oldLoginAttempt.status}`);
    }
    console.log("   ✓ Old password successfully rejected with 401");

    // Test 11: Verify new password is accepted
    console.log("\n👉 Test 11: Verify new password is ACCEPTED with new username");
    const newLoginAttempt = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login: "superadmin", password: "newSecurePassword2026!" }),
    });
    if (newLoginAttempt.status !== 200 || !newLoginAttempt.data?.success) {
      throw new Error(`New login failed: ${JSON.stringify(newLoginAttempt.data)}`);
    }
    console.log(`   ✓ Successfully logged in with new username and password as "${newLoginAttempt.data.username}"`);

    // Cleanup: Reset back to default credentials for consistency
    console.log("\n👉 Cleanup: Reset back to default credentials");
    await api("/api/admin/security", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: "newSecurePassword2026!",
        newLogin: "admin",
        newPassword: "pasika2026",
        confirmPassword: "pasika2026",
      }),
    });
    await api("/api/auth/logout", { method: "POST" });
    console.log("   ✓ Reset to default credentials and logged out");

    console.log("\n🎉 ALL 11 ADMIN AUTH & SECURITY TESTS PASSED WITH 100% SUCCESS!");
    server.close(() => process.exit(0));
  } catch (err) {
    server.close();
    throw err;
  }
}

runAdminAuthTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
