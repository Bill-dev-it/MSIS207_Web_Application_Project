"use strict";

const repository = require("./orders.repository");

function failure(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

async function getOrders({ companyId, status = "ALL", search = "", page = "1", limit = "10" }) {
  if (status !== "ALL" && !repository.STATUSES.includes(status)) {
    failure(400, "INVALID_STATUS", "Unsupported order status.");
  }
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  if (!/^[1-9]\d*$/.test(String(page)) || !Number.isSafeInteger(pageNumber) ||
      !/^[1-9]\d*$/.test(String(limit)) || !Number.isSafeInteger(limitNumber) ||
      limitNumber > 100) {
    failure(400, "INVALID_PAGINATION", "Page must be positive and limit must be between 1 and 100.");
  }
  if (typeof search !== "string" || search.length > 200) {
    failure(400, "INVALID_SEARCH", "Search text must be at most 200 characters.");
  }
  return repository.getBuyerOrders({
    companyId,
    status,
    search: search.trim(),
    page: pageNumber,
    limit: limitNumber,
  });
}

module.exports = { getOrders };
