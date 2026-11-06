"use strict";

const pool = require("../../config/db");

async function getOrCreateCart(userId, client = pool) {
  const result = await client.query(`
    INSERT INTO carts (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING cart_id, user_id
  `, [userId]);
  return result.rows[0];
}

async function getCartItems(userId) {
  const result = await pool.query(`
    SELECT ci.cart_item_id, ci.listing_id, ci.quantity,
           sl.price AS unit_price, sl.stock_quantity, sl.seller_sku,
           sl.condition, sl.status AS listing_status, s.store_name AS supplier_name,
           s.status AS supplier_status, p.is_active AS product_active,
           (sl.status = 'ACTIVE' AND s.status = 'APPROVED' AND p.is_active) AS offer_available,
           p.product_id, p.product_name, p.part_number, p.product_type,
           c.category_name, ci.quantity * sl.price AS line_total
    FROM carts ca
    JOIN cart_items ci ON ci.cart_id = ca.cart_id
    JOIN seller_listings sl ON sl.listing_id = ci.listing_id
    JOIN suppliers s ON s.supplier_id = sl.supplier_id
    JOIN products p ON p.product_id = sl.product_id
    LEFT JOIN categories c ON c.category_id = p.category_id
    WHERE ca.user_id = $1
    ORDER BY ci.cart_item_id DESC
  `, [userId]);
  return result.rows;
}

async function getListingForUpdate(client, listingId) {
  const result = await client.query(`
    SELECT sl.listing_id, sl.stock_quantity, sl.status,
           s.status AS supplier_status
    FROM seller_listings sl
    JOIN suppliers s ON s.supplier_id = sl.supplier_id
    JOIN products p ON p.product_id = sl.product_id
    WHERE sl.listing_id = $1 AND p.is_active = TRUE
    FOR UPDATE OF sl
  `, [listingId]);
  return result.rows[0] || null;
}

async function getCartItemForUpdate(client, userId, listingId) {
  const result = await client.query(`
    SELECT ci.cart_item_id, ci.quantity
    FROM cart_items ci
    JOIN carts ca ON ca.cart_id = ci.cart_id
    WHERE ca.user_id = $1 AND ci.listing_id = $2
    FOR UPDATE OF ci
  `, [userId, listingId]);
  return result.rows[0] || null;
}

async function upsertCartItem(client, cartId, listingId, quantity) {
  const result = await client.query(`
    INSERT INTO cart_items (cart_id, listing_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (cart_id, listing_id)
    DO UPDATE SET quantity = EXCLUDED.quantity
    RETURNING cart_item_id
  `, [cartId, listingId, quantity]);
  return result.rows[0];
}

async function updateItemQuantity(client, userId, cartItemId, quantity) {
  const result = await client.query(`
    UPDATE cart_items ci SET quantity = $1
    FROM carts ca
    WHERE ci.cart_item_id = $2 AND ci.cart_id = ca.cart_id AND ca.user_id = $3
    RETURNING ci.cart_item_id
  `, [quantity, cartItemId, userId]);
  return result.rowCount > 0;
}

async function getCartItemListingForUpdate(client, userId, cartItemId) {
  const result = await client.query(`
    SELECT ci.listing_id
    FROM cart_items ci
    JOIN carts ca ON ca.cart_id = ci.cart_id
    WHERE ci.cart_item_id = $1 AND ca.user_id = $2
    FOR UPDATE OF ci
  `, [cartItemId, userId]);
  return result.rows[0] || null;
}

async function removeItem(client, userId, cartItemId) {
  const result = await client.query(`
    DELETE FROM cart_items ci
    USING carts ca
    WHERE ci.cart_item_id = $1 AND ci.cart_id = ca.cart_id AND ca.user_id = $2
    RETURNING ci.cart_item_id
  `, [cartItemId, userId]);
  return result.rowCount > 0;
}

async function clearCart(client, cartId) {
  await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
}

module.exports = {
  pool,
  getOrCreateCart,
  getCartItems,
  getListingForUpdate,
  getCartItemForUpdate,
  getCartItemListingForUpdate,
  upsertCartItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
