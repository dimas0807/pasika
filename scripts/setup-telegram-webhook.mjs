/**
 * 🐝 PASIKA TELEGRAM WEBHOOK MANAGEMENT UTILITY
 * 
 * Safely inspects, configures, or removes the Telegram Bot webhook
 * using environment variables without exposing tokens in shell history.
 * 
 * Usage:
 *   node scripts/setup-telegram-webhook.mjs --info
 *   node scripts/setup-telegram-webhook.mjs https://<your-railway-domain>.up.railway.app
 *   node scripts/setup-telegram-webhook.mjs --delete
 */

import dotenv from "dotenv";
import { getTelegramCredentials, maskToken } from "../server/telegram/index.js";

dotenv.config();

const arg = process.argv[2];

async function main() {
  const { token, botUsername } = getTelegramCredentials();

  if (!token) {
    console.error("❌ Error: TELEGRAM_BOT_TOKEN is not configured in .env or SQLite settings.");
    process.exit(1);
  }

  console.log("🐝 PASIKA Telegram Webhook Tool");
  console.log(`🤖 Bot: ${botUsername || "Configured"} (Token: ${maskToken(token)})`);

  if (!arg || arg === "--info") {
    console.log("\n📡 Querying current webhook info from Telegram API...");
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    if (!data.ok) {
      console.error("❌ Telegram API error:", data.description);
      process.exit(1);
    }
    console.log("📋 Webhook Status:");
    console.log(`   URL: ${data.result.url || "(none / webhook not configured)"}`);
    console.log(`   Pending updates: ${data.result.pending_update_count}`);
    if (data.result.last_error_date) {
      console.log(`   Last error date: ${new Date(data.result.last_error_date * 1000).toISOString()}`);
      console.log(`   Last error message: ${data.result.last_error_message}`);
    }
    return;
  }

  if (arg === "--delete") {
    console.log("\n🗑 Removing webhook (switching to getUpdates)...");
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
    const data = await res.json();
    if (data.ok) {
      console.log("✅ Webhook removed successfully.");
    } else {
      console.error("❌ Failed to remove webhook:", data.description);
    }
    return;
  }

  // Setting webhook URL
  let targetUrl = arg.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }
  // Ensure path ends with /api/telegram/webhook
  targetUrl = targetUrl.replace(/\/$/, "");
  if (!targetUrl.endsWith("/api/telegram/webhook")) {
    targetUrl += "/api/telegram/webhook";
  }

  console.log(`\n🔗 Registering webhook URL: ${targetUrl}`);
  const payload = {
    url: targetUrl,
    allowed_updates: ["message", "callback_query"],
  };

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.ok) {
    console.log("✅ Telegram Webhook registered successfully!");
    console.log(`   Updates will be dispatched to: ${targetUrl}`);
  } else {
    console.error("❌ Telegram API setWebhook error:", data.description);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});
