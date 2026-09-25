/**
 * Customers Management Module
 * Handles customer deduplication, profile history, and repeat order tracking
 */

import { db, normalizePhone } from "./db.js";
import { getFullOrder } from "./orders.js";

/**
 * Get all customers with search and sorting
 */
export function getAdminCustomers(req, res) {
  try {
    const search = (req.query.search || "").trim();
    const sort = req.query.sort || "recent"; // 'recent', 'spent', 'orders', 'name'

    let query = `
      SELECT 
        id, phone, first_name, last_name, email,
        total_orders, total_spent, first_order_at, last_order_at, created_at, updated_at
      FROM customers
    `;
    const params = [];

    if (search) {
      query += `
        WHERE phone LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
      `;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (sort === "spent") {
      query += " ORDER BY total_spent DESC";
    } else if (sort === "orders") {
      query += " ORDER BY total_orders DESC";
    } else if (sort === "name") {
      query += " ORDER BY first_name ASC, last_name ASC";
    } else {
      query += " ORDER BY last_order_at DESC";
    }

    const rows = db.prepare(query).all(...params);

    return res.json(
      rows.map((r) => ({
        id: r.id,
        phone: r.phone,
        firstName: r.first_name,
        lastName: r.last_name,
        name: `${r.first_name} ${r.last_name}`.trim(),
        email: r.email || "",
        totalOrders: r.total_orders,
        totalSpent: r.total_spent,
        firstOrderAt: r.first_order_at,
        lastOrderAt: r.last_order_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))
    );
  } catch (err) {
    console.error("[Get Customers Error]:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get single customer profile and all their orders
 */
export function getAdminCustomerById(req, res) {
  try {
    const { id } = req.params;
    let customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);

    // Also support lookup by phone
    if (!customer) {
      const norm = normalizePhone(id);
      if (norm) {
        customer = db.prepare("SELECT * FROM customers WHERE phone = ?").get(norm);
      }
    }

    if (!customer) {
      return res.status(404).json({ error: "Клієнта не знайдено" });
    }

    // Fetch all orders for this customer (excluding soft-deleted)
    const orderRows = db
      .prepare(`
        SELECT id FROM orders
        WHERE (customer_id = ? OR customer_phone = ?) AND deleted_at IS NULL
        ORDER BY created_at DESC
      `)
      .all(customer.id, customer.phone);

    const orders = orderRows.map((r) => getFullOrder(r.id)).filter(Boolean);

    return res.json({
      customer: {
        id: customer.id,
        phone: customer.phone,
        firstName: customer.first_name,
        lastName: customer.last_name,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        email: customer.email || "",
        totalOrders: customer.total_orders,
        totalSpent: customer.total_spent,
        firstOrderAt: customer.first_order_at,
        lastOrderAt: customer.last_order_at,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
      },
      orders,
    });
  } catch (err) {
    console.error("[Get Customer Details Error]:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
