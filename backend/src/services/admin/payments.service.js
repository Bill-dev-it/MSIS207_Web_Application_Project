"use strict";

const repository = require("./payments.repository");

const MAX_ID = 9223372036854775807n;

function validateOrderId(orderId) {
  if (
    typeof orderId !== "string" ||
    !/^[1-9]\d*$/.test(orderId) ||
    BigInt(orderId) > MAX_ID
  ) {
    const error = new Error("Order ID must be a positive BIGINT.");
    error.statusCode = 400;
    error.code = "INVALID_ORDER_ID";
    throw error;
  }
  return orderId;
}

async function confirmPayment(orderId) {
  const validOrderId = validateOrderId(orderId);
  return await repository.confirmBankTransferPayment(validOrderId);
}

async function cancelPayment(orderId) {
  const validOrderId = validateOrderId(orderId);
  return await repository.cancelBankTransferPayment(validOrderId);
}

module.exports = {
  confirmPayment,
  cancelPayment,
};

