"use strict";

const repository = require("./orderConfirmation.repository");
const MAX_ID = 9223372036854775807n;

async function getConfirmation(orderId, companyId) {
  if (typeof orderId !== "string" || !/^[1-9]\d*$/.test(orderId) ||
      BigInt(orderId) > MAX_ID) {
    const error = new Error("Invalid order ID.");
    error.statusCode = 400;
    error.code = "INVALID_ORDER_ID";
    throw error;
  }
  const order = await repository.getOrderConfirmation(orderId, companyId);
  if (!order) {
    const error = new Error("Order confirmation not found.");
    error.statusCode = 404;
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }
  return order;
}

module.exports = { getConfirmation };
