"use strict";

const service = require("../../services/buyer/cart.service");

function respondError(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error("Buyer cart request failed:", error);
  return res.status(status).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: status >= 500 ? "Unable to process cart request." : error.message,
    },
  });
}

async function getCart(req, res) {
  try {
    const data = await service.getCart(req.authUser.user_id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondError(res, error);
  }
}

async function addItem(req, res) {
  try {
    const data = await service.addItem(req.authUser.user_id, req.body?.listing_id, req.body?.quantity ?? 1);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondError(res, error);
  }
}

async function updateQuantity(req, res) {
  try {
    const data = await service.updateQuantity(req.authUser.user_id, req.params.cartItemId, req.body?.quantity);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondError(res, error);
  }
}

async function removeItem(req, res) {
  try {
    const data = await service.removeItem(req.authUser.user_id, req.params.cartItemId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondError(res, error);
  }
}

async function clearCart(req, res) {
  try {
    const data = await service.clearCart(req.authUser.user_id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondError(res, error);
  }
}

module.exports = { getCart, addItem, updateQuantity, removeItem, clearCart };
