"use strict";

const paymentListRepository = require("./payment-list.repository");

const STATUSES = ["PENDING", "SUCCEEDED", "CANCELLED", "ALL"];

function invalid(code, message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = code;
  throw error;
}

async function listPayments({ status = "PENDING", page = "1", limit = "10" } = {}) {
  if (!STATUSES.includes(status)) {
    invalid("INVALID_STATUS", "Status must be PENDING, SUCCEEDED, CANCELLED, or ALL.");
  }

  if (
    !/^[1-9]\d*$/.test(page) ||
    !/^[1-9]\d*$/.test(limit) ||
    Number(page) > 1000000 ||
    Number(limit) > 100
  ) {
    invalid("INVALID_PAGINATION", "Page must be 1–1000000 and limit 1–100.");
  }

  return await paymentListRepository.listPayments({
    status,
    page: Number(page),
    limit: Number(limit),
  });
}

module.exports = { listPayments };

