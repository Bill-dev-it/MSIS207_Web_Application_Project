"use strict";

const crypto = require("node:crypto");
const pool = require("../../config/db");

const DELIVERY_METHODS = [
  {
    id: "STANDARD",
    name: "Standard freight (simulated estimate)",
    cost: "1250.00",
    lead_time: "3-5 business days",
    description: "Demonstration-only freight estimate; not a carrier quote.",
  },
  {
    id: "EXPRESS",
    name: "Expedited freight (simulated estimate)",
    cost: "2900.00",
    lead_time: "24-48 hours",
    description: "Demonstration-only freight estimate; not a carrier quote.",
  },
];

function getDeliveryMethod(id) {
  return DELIVERY_METHODS.find((method) => method.id === id) || null;
}

async function getAddresses(companyId) {
  const result = await pool.query(`
    SELECT address_id, company_id, recipient_name, phone, address_line,
           city, region, postal_code, country_code
    FROM addresses
    WHERE company_id = $1
    ORDER BY address_id
  `, [companyId]);
  return result.rows;
}

async function createAddress(companyId, address) {
  const result = await pool.query(`
    INSERT INTO addresses
      (company_id, recipient_name, phone, address_line, city, region, postal_code, country_code)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING address_id, company_id, recipient_name, phone, address_line,
              city, region, postal_code, country_code
  `, [
    companyId, address.recipient_name, address.phone, address.address_line,
    address.city, address.region || null, address.postal_code || null, address.country_code,
  ]);
  return result.rows[0];
}

async function getCompany(companyId) {
  const result = await pool.query(`
    SELECT company_id, company_name, company_type, tax_id, country_code
    FROM companies WHERE company_id = $1
  `, [companyId]);
  return result.rows[0] || null;
}

function moneyToCents(value) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new Error("Invalid monetary value returned by database.");
  return BigInt(match[1]) * 100n + BigInt((match[2] || "").padEnd(2, "0") || "0");
}

function centsToMoney(cents) {
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

function failure(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

async function placeOrderTransaction({
  userId,
  companyId,
  shippingAddressId,
  billingAddressId,
  deliveryMethodId,
  purchaseReference,
  paymentMethod,
  checkoutKey,
}) {
  const deliveryMethod = getDeliveryMethod(deliveryMethodId);
  if (!deliveryMethod) throw failure(400, "INVALID_DELIVERY_METHOD", "Select a supported delivery option.");
  if (paymentMethod !== "SIMULATION") {
    throw failure(400, "UNSUPPORTED_PAYMENT_METHOD", "Only simulated payment is available.");
  }

  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;

    const cartResult = await client.query(
      "SELECT cart_id FROM carts WHERE user_id = $1 FOR UPDATE",
      [userId]
    );
    if (!cartResult.rowCount) throw failure(409, "CART_EMPTY", "Your cart is empty.");
    const cartId = cartResult.rows[0].cart_id;

    const existing = await client.query(`
      SELECT order_id, order_number, checkout_key, grand_total, currency, created_at
      FROM orders
      WHERE placed_by = $1 AND buyer_company_id = $2 AND checkout_key = $3
    `, [userId, companyId, checkoutKey]);
    if (existing.rowCount) {
      await client.query("COMMIT");
      transactionOpen = false;
      return { order: existing.rows[0], created: false };
    }

    const companyResult = await client.query(
      "SELECT company_name, tax_id FROM companies WHERE company_id = $1",
      [companyId]
    );
    const shippingResult = await client.query(`
        SELECT address_id, recipient_name, phone, address_line, city,
               region, postal_code, country_code
        FROM addresses
        WHERE address_id = $1 AND company_id = $2
      `, [shippingAddressId, companyId]);
    if (!companyResult.rowCount) throw failure(404, "COMPANY_NOT_FOUND", "Buyer company was not found.");
    if (!shippingResult.rowCount) throw failure(400, "INVALID_SHIPPING_ADDRESS", "Choose an address registered to your company.");

    const billingId = billingAddressId || shippingAddressId;
    const billingResult = billingId === shippingAddressId
      ? shippingResult
      : await client.query(`
          SELECT address_id, recipient_name, phone, address_line, city,
                 region, postal_code, country_code
          FROM addresses
          WHERE address_id = $1 AND company_id = $2
        `, [billingId, companyId]);
    if (!billingResult.rowCount) throw failure(400, "INVALID_BILLING_ADDRESS", "Choose a billing address registered to your company.");

    const itemsResult = await client.query(`
      SELECT ci.cart_item_id, ci.quantity, sl.listing_id, sl.price AS unit_price,
             sl.stock_quantity, sl.seller_sku, sl.condition, sl.status AS listing_status,
             sl.supplier_id, s.store_name AS supplier_name, s.status AS supplier_status,
             p.product_name, p.part_number, p.is_active
      FROM cart_items ci
      JOIN seller_listings sl ON sl.listing_id = ci.listing_id
      JOIN suppliers s ON s.supplier_id = sl.supplier_id
      JOIN products p ON p.product_id = sl.product_id
      WHERE ci.cart_id = $1
      ORDER BY sl.listing_id
      FOR UPDATE OF sl
    `, [cartId]);
    if (!itemsResult.rowCount) throw failure(409, "CART_EMPTY", "Your cart is empty.");

    const supplierGroups = new Map();
    let subtotalCents = 0n;
    for (const item of itemsResult.rows) {
      if (item.listing_status !== "ACTIVE" || item.supplier_status !== "APPROVED" || !item.is_active) {
        throw failure(409, "OFFER_UNAVAILABLE", `The offer for "${item.product_name}" is no longer available.`);
      }
      if (item.quantity > item.stock_quantity) {
        throw failure(409, "INSUFFICIENT_STOCK", `Only ${item.stock_quantity} units of "${item.product_name}" remain.`);
      }
      const lineTotal = moneyToCents(item.unit_price) * BigInt(item.quantity);
      subtotalCents += lineTotal;
      const key = String(item.supplier_id);
      if (!supplierGroups.has(key)) {
        supplierGroups.set(key, {
          supplierId: item.supplier_id,
          supplierName: item.supplier_name,
          subtotalCents: 0n,
          items: [],
        });
      }
      const group = supplierGroups.get(key);
      group.subtotalCents += lineTotal;
      group.items.push({ ...item, lineTotalCents: lineTotal });
    }

    const shippingCents = moneyToCents(deliveryMethod.cost);
    const grandTotalCents = subtotalCents + shippingCents;
    const orderNumber = `ORD-${crypto.randomUUID().replace(/-/g, "").toUpperCase()}`;
    const company = companyResult.rows[0];
    const shipping = shippingResult.rows[0];
    const billing = billingResult.rows[0];
    const orderResult = await client.query(`
      INSERT INTO orders
        (order_number, buyer_company_id, placed_by, checkout_key, purchase_reference,
         company_name_snapshot, tax_id_snapshot, shipping_address_snapshot,
         billing_address_snapshot, currency, subtotal, shipping_total, grand_total)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::json, $9::json, 'USD', $10, $11, $12)
      RETURNING order_id, order_number, checkout_key, grand_total, currency, created_at
    `, [
      orderNumber, companyId, userId, checkoutKey, purchaseReference || null,
      company.company_name, company.tax_id || null, JSON.stringify(shipping),
      JSON.stringify(billing), centsToMoney(subtotalCents), centsToMoney(shippingCents),
      centsToMoney(grandTotalCents),
    ]);
    const order = orderResult.rows[0];

    const groups = [...supplierGroups.values()];
    let remainingShippingCents = shippingCents;
    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      const feeCents = index === groups.length - 1
        ? remainingShippingCents
        : shippingCents / BigInt(groups.length);
      remainingShippingCents -= feeCents;
      const sellerOrderResult = await client.query(`
        INSERT INTO seller_orders
          (order_id, supplier_id, supplier_name_snapshot, status, subtotal, shipping_fee, grand_total)
        VALUES ($1, $2, $3, 'CONFIRMED', $4, $5, $6)
        RETURNING seller_order_id
      `, [
        order.order_id, group.supplierId, group.supplierName,
        centsToMoney(group.subtotalCents), centsToMoney(feeCents),
        centsToMoney(group.subtotalCents + feeCents),
      ]);
      const sellerOrderId = sellerOrderResult.rows[0].seller_order_id;

      for (const item of group.items) {
        const stockResult = await client.query(`
          UPDATE seller_listings sl
          SET stock_quantity = sl.stock_quantity - $1, updated_at = CURRENT_TIMESTAMP
          WHERE sl.listing_id = $2
            AND sl.status = 'ACTIVE'
            AND sl.stock_quantity >= $1
            AND EXISTS (
              SELECT 1
              FROM suppliers s
              JOIN products p ON p.product_id = sl.product_id
              WHERE s.supplier_id = sl.supplier_id
                AND s.status = 'APPROVED'
                AND p.is_active = TRUE
            )
          RETURNING sl.listing_id
        `, [item.quantity, item.listing_id]);
        if (!stockResult.rowCount) {
          throw failure(409, "INSUFFICIENT_STOCK", `Stock changed for "${item.product_name}".`);
        }
        await client.query(`
          INSERT INTO order_items
            (seller_order_id, listing_id, product_name_snapshot, part_number_snapshot,
             seller_sku_snapshot, condition_snapshot, quantity, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          sellerOrderId, item.listing_id, item.product_name, item.part_number,
          item.seller_sku, item.condition, item.quantity,
          item.unit_price, centsToMoney(item.lineTotalCents),
        ]);
      }
    }

    await client.query(`
      INSERT INTO payments (order_id, payment_method, amount, status)
      VALUES ($1, 'SIMULATION', $2, 'SUCCEEDED')
    `, [order.order_id, centsToMoney(grandTotalCents)]);
    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    await client.query("COMMIT");
    transactionOpen = false;
    return { order, created: true };
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  DELIVERY_METHODS,
  getAddresses,
  createAddress,
  getCompany,
  placeOrderTransaction,
};
