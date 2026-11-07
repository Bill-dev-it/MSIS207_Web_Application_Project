"use strict";

const companiesRepository = require("./companies.repository");

const MAX_BIGINT = 9223372036854775807n;

function createError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

function validateCompanyId(rawCompanyId) {
  const value = String(rawCompanyId ?? "").trim();

  if (!/^[1-9]\d*$/.test(value)) {
    throw createError(
      400,
      "INVALID_COMPANY_ID",
      "Company ID must be a valid positive integer."
    );
  }

  try {
    const parsed = BigInt(value);
    if (parsed > MAX_BIGINT) {
      throw new Error("Out of BIGINT range");
    }
  } catch {
    throw createError(
      400,
      "INVALID_COMPANY_ID",
      "Company ID must be a valid positive integer."
    );
  }

  return value;
}

async function listCompanies(query = {}) {
  const search =
    typeof query.search === "string" ? query.search.trim() : "";

  if (search.length > 100) {
    throw createError(
      400,
      "SEARCH_TOO_LONG",
      "Search query must not exceed 100 characters."
    );
  }

  const items = await companiesRepository.findBuyerCompanies({
    search,
  });

  return {
    items,
    total: items.length,
  };
}

async function getCompanyDetail(rawCompanyId) {
  const companyId = validateCompanyId(rawCompanyId);
  const company = await companiesRepository.findBuyerCompanyById(companyId);

  if (!company) {
    throw createError(
      404,
      "COMPANY_NOT_FOUND",
      "The requested buyer company was not found."
    );
  }

  return company;
}

module.exports = {
  listCompanies,
  getCompanyDetail,
};

