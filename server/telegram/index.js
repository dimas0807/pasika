/**
 * 🐝 PASIKA TELEGRAM MODULE
 * Dedicated structured Telegram interface module for the PASIKA e-commerce platform.
 * 
 * Single source of truth: PASIKA SQLite Database.
 * This module connects orders, admin management, and Telegram alerts.
 */

// Bot API Client
export * from "./client/botApi.js";

// Configuration & Credentials
export * from "./config/botConfig.js";

// Recipients Management (owner, admin, manager)
export * from "./recipients/recipientsManager.js";

// Message Formatting & Inline Keyboards
export * from "./messages/formatter.js";

// Order Notifications (Multi-recipient & Fault-tolerant)
export * from "./orders/notifications.js";

// Order Actions (Accept / Reject / Stock synchronization)
export * from "./orders/actions.js";

// Bot Commands (/start & interactions)
export * from "./commands/startCommand.js";

// Callback Queries (Button interactions)
export * from "./callbacks/orderCallbacks.js";

// Webhook Dispatcher
export * from "./webhook/webhookHandler.js";

// Logging & Audit Trail
export * from "./logging/telegramLogger.js";
