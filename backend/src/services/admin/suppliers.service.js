"use strict";

const repository = require("./suppliers.repository");

const MAX_PAGE = 1000000;
const MAX_LIMIT = 100;

function failure(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

async function listSuppliers({
  status = "PENDING",
  page = "1",
  limit = "10",
  search = "",
} = {}) {
  if (
    typeof status !== "string" ||
    !repository.SUPPLIER_STATUSES.includes(status)
  ) {
    failure(
      400,
      "INVALID_STATUS",
      "Status filter must be PENDING, APPROVED, or SUSPENDED."
    );
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  if (
    !/^[1-9]\d*$/.test(String(page)) ||
    !Number.isSafeInteger(pageNumber) ||
    pageNumber > MAX_PAGE ||
    !/^[1-9]\d*$/.test(String(limit)) ||
    !Number.isSafeInteger(limitNumber) ||
    limitNumber > MAX_LIMIT
  ) {
    failure(
      400,
      "INVALID_PAGINATION",
      "Page must be positive and limit must be between 1 and 100."
    );
  }

  if (typeof search !== "string" || search.length > 120) {
    failure(400, "INVALID_SEARCH", "Search must contain at most 120 characters.");
  }
  return await repository.listSuppliers({
    status,
    page: pageNumber,
    limit: limitNumber,
    search: search.trim(),
  });
}

async function approveSupplier(supplierId) {
  if (!repository.validSupplierId(supplierId)) {
    failure(400, "INVALID_SUPPLIER_ID", "Supplier ID must be a positive BIGINT.");
  }
  return await repository.approveSupplier(supplierId);
}

module.exports = { listSuppliers, approveSupplier };
