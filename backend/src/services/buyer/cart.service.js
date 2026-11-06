"use strict";

const repository = require("./cart.repository");

const MAX_ID = 9223372036854775807n;
const MAX_QUANTITY = 2147483647;

function fail(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

function validId(value) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value) && BigInt(value) <= MAX_ID;
}

function validQuantity(value) {
  return Number.isSafeInteger(value) && value > 0 && value <= MAX_QUANTITY;
}

async function getCart(userId) {
  const items = await repository.getCartItems(userId);
  return {
    items,
    subtotal: Number(items.reduce((sum, item) => sum + Number(item.line_total), 0).toFixed(2)),
    total_items: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

async function addItem(userId, listingId, quantity) {
  if (!validId(listingId)) fail(400, "INVALID_LISTING_ID", "A valid listing_id is required.");
  if (!validQuantity(quantity)) fail(400, "INVALID_QUANTITY", "Quantity must be a positive integer.");

  const client = await repository.pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const cart = await repository.getOrCreateCart(userId, client);
    const listing = await repository.getListingForUpdate(client, listingId);
    if (!listing) fail(404, "LISTING_NOT_FOUND", "Supplier offer is not available.");
    if (listing.status !== "ACTIVE" || listing.supplier_status !== "APPROVED") {
      fail(409, "OFFER_UNAVAILABLE", "This supplier offer is no longer available.");
    }

    const existing = await repository.getCartItemForUpdate(client, userId, listingId);
    const aggregateQuantity = (existing?.quantity || 0) + quantity;
    if (aggregateQuantity > listing.stock_quantity) {
      fail(409, "INSUFFICIENT_STOCK", `Only ${listing.stock_quantity} units are available.`);
    }
    await repository.upsertCartItem(client, cart.cart_id, listingId, aggregateQuantity);
    await client.query("COMMIT");
    transactionOpen = false;
    return await getCart(userId);
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateQuantity(userId, cartItemId, quantity) {
  if (!validId(cartItemId)) fail(400, "INVALID_CART_ITEM_ID", "Invalid cart item ID.");
  if (!validQuantity(quantity)) fail(400, "INVALID_QUANTITY", "Quantity must be a positive integer.");

  const client = await repository.pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    await repository.getOrCreateCart(userId, client);
    const item = await repository.getCartItemListingForUpdate(client, userId, cartItemId);
    if (!item) fail(404, "CART_ITEM_NOT_FOUND", "Cart item not found.");
    const listing = await repository.getListingForUpdate(client, item.listing_id);
    if (!listing || listing.status !== "ACTIVE" || listing.supplier_status !== "APPROVED") {
      fail(409, "OFFER_UNAVAILABLE", "This supplier offer is no longer available.");
    }
    if (quantity > listing.stock_quantity) {
      fail(409, "INSUFFICIENT_STOCK", `Only ${listing.stock_quantity} units are available.`);
    }
    await repository.updateItemQuantity(client, userId, cartItemId, quantity);
    await client.query("COMMIT");
    transactionOpen = false;
    return await getCart(userId);
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function removeItem(userId, cartItemId) {
  if (!validId(cartItemId)) fail(400, "INVALID_CART_ITEM_ID", "Invalid cart item ID.");
  const client = await repository.pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    await repository.getOrCreateCart(userId, client);
    if (!(await repository.removeItem(client, userId, cartItemId))) {
      fail(404, "CART_ITEM_NOT_FOUND", "Cart item not found.");
    }
    await client.query("COMMIT");
    transactionOpen = false;
    return await getCart(userId);
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function clearCart(userId) {
  const client = await repository.pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const cart = await repository.getOrCreateCart(userId, client);
    await repository.clearCart(client, cart.cart_id);
    await client.query("COMMIT");
    transactionOpen = false;
    return await getCart(userId);
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { getCart, addItem, updateQuantity, removeItem, clearCart };
