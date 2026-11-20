"use strict";

const service = require("../../services/supplier/listings.service");

const MAX_BIGINT_ID = 9223372036854775807n;
const MAX_PG_INT = 2147483647;
const CONDITIONS = ["NEW", "USED", "REFURBISHED"];
const STATUSES = ["DRAFT", "ACTIVE", "HIDDEN"];
const PRICE_REGEX = /^(0|[1-9]\d{0,15})(\.\d{1,2})?$/;

function validId(value) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value) && BigInt(value) <= MAX_BIGINT_ID;
}

function parseProductIdValue(value) {
  const isStringOrSafeInt =
    typeof value === "string" || (typeof value === "number" && Number.isSafeInteger(value));
  if (!isStringOrSafeInt) return null;
  const normalized = String(value);
  return validId(normalized) ? normalized : null;
}

function parseSellerSkuValue(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 100) return null;
  return trimmed;
}

// Preserve decimal precision as a string matching the database numeric scale.
function parsePriceValue(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const normalized = String(value);
  return PRICE_REGEX.test(normalized) ? normalized : null;
}

function parseNonNegativePgInt(value) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_PG_INT) return null;
  return value;
}

// Each field validator returns the normalized value or null when invalid.
// Returning null keeps explicit invalid/null field values distinct from omitted keys.
const FIELD_VALIDATORS = {
  product_id: parseProductIdValue,
  seller_sku: parseSellerSkuValue,
  condition: (value) => (CONDITIONS.includes(value) ? value : null),
  status: (value) => (STATUSES.includes(value) ? value : null),
  price: parsePriceValue,
  stock_quantity: parseNonNegativePgInt,
  lead_time_days: parseNonNegativePgInt,
};
const ALLOWED_FIELDS = Object.keys(FIELD_VALIDATORS);

// Create requires all fields (partial = false); update accepts any non-empty whitelisted subset.
function validateListingInput(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !ALLOWED_FIELDS.includes(key))) return null;
  if (!partial && ALLOWED_FIELDS.some((key) => !keys.includes(key))) return null;

  const data = {};
  for (const key of keys) {
    const parsed = FIELD_VALIDATORS[key](body[key]);
    if (parsed === null) return null;
    data[key] = parsed;
  }
  return data;
}

function invalid(res, message = "Invalid listing input.") {
  return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message } });
}

function missing(res) {
  return res.status(404).json({ success: false, error: { code: "LISTING_NOT_FOUND", message: "Listing not found." } });
}

// Translate PostgreSQL constraint errors into the existing supplier listing error codes.
function failed(res, error) {
  if (error.code === "23505") {
    return res.status(409).json({ success: false, error: { code: "DUPLICATE_SKU", message: "This supplier SKU already exists." } });
  }
  if (error.code === "23503") return invalid(res, "Referenced data does not exist.");
  if (error.code === "23514" || error.code === "22003") {
    return invalid(res, "Listing values violate database constraints.");
  }
  console.error("Supplier listings failed:", error);
  return res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Unable to process listing." } });
}

// req.supplierId is injected by requireSupplier from the APPROVED supplier row in PostgreSQL.
async function getAll(req, res) {
  try {
    const data = await service.getAll(req.supplierId);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return failed(res, error);
  }
}

async function getOne(req, res) {
  if (!validId(req.params.listingId)) return invalid(res, "Invalid listing ID.");
  try {
    const data = await service.getOne(req.supplierId, req.params.listingId);
    return data ? res.status(200).json({ success: true, data }) : missing(res);
  } catch (error) {
    return failed(res, error);
  }
}

async function create(req, res) {
  const data = validateListingInput(req.body);
  if (!data) return invalid(res);
  try {
    const created = await service.create(req.supplierId, data);
    if (!created) return invalid(res, "Product does not exist or is inactive.");
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return failed(res, error);
  }
}

async function update(req, res) {
  if (!validId(req.params.listingId)) return invalid(res, "Invalid listing ID.");
  const data = validateListingInput(req.body, true);
  if (!data) return invalid(res);
  try {
    const updated = await service.update(req.supplierId, req.params.listingId, data);
    if (updated?.invalidProduct) return invalid(res, "Product does not exist or is inactive.");
    return updated ? res.status(200).json({ success: true, data: updated }) : missing(res);
  } catch (error) {
    return failed(res, error);
  }
}

async function hide(req, res) {
  if (!validId(req.params.listingId)) return invalid(res, "Invalid listing ID.");
  try {
    const hidden = await service.hide(req.supplierId, req.params.listingId);
    return hidden ? res.status(200).json({ success: true, message: "Listing hidden." }) : missing(res);
  } catch (error) {
    return failed(res, error);
  }
}

module.exports = { getAll, getOne, create, update, hide };
