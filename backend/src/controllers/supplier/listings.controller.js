const service = require("../../services/supplier/listings.service");

const MAX_ID = 9223372036854775807n;
const allowed = ["product_id", "seller_sku", "condition", "price", "stock_quantity", "lead_time_days", "status"];
const conditions = ["NEW", "USED", "REFURBISHED"];
const statuses = ["DRAFT", "ACTIVE", "HIDDEN"];

function validId(value) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value) && BigInt(value) <= MAX_ID;
}

function validate(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !allowed.includes(key))) return null;
  if (!partial && allowed.some((key) => !keys.includes(key))) return null;

  const data = {};
  for (const key of keys) {
    const value = body[key];
    if (key === "product_id") {
      if (!(typeof value === "string" || (typeof value === "number" && Number.isSafeInteger(value))) || !validId(String(value))) return null;
      data[key] = String(value);
    } else if (key === "seller_sku") {
      if (typeof value !== "string" || !value.trim() || value.trim().length > 100) return null;
      data[key] = value.trim();
    } else if (key === "condition") {
      if (!conditions.includes(value)) return null;
      data[key] = value;
    } else if (key === "status") {
      if (!statuses.includes(value)) return null;
      data[key] = value;
    } else if (key === "price") {
      const price = String(value);
      if (!(typeof value === "number" || typeof value === "string") || !/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/.test(price)) return null;
      data[key] = price;
    } else {
      if (!Number.isInteger(value) || value < 0 || value > 2147483647) return null;
      data[key] = value;
    }
  }
  return data;
}

function invalid(res, message = "Invalid listing input.") {
  return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message } });
}

function missing(res) {
  return res.status(404).json({ success: false, error: { code: "LISTING_NOT_FOUND", message: "Listing not found." } });
}

function failed(res, error) {
  if (error.code === "23505") {
    return res.status(409).json({ success: false, error: { code: "DUPLICATE_SKU", message: "This supplier SKU already exists." } });
  }
  if (error.code === "23503") return invalid(res, "Referenced data does not exist.");
  if (error.code === "23514" || error.code === "22003") return invalid(res, "Listing values violate database constraints.");
  console.error("Supplier listings failed:", error);
  return res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Unable to process listing." } });
}

async function getAll(req, res) {
  try {
    const data = await service.getAll(req.supplierId);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) { return failed(res, error); }
}

async function getOne(req, res) {
  if (!validId(req.params.listingId)) return invalid(res, "Invalid listing ID.");
  try {
    const data = await service.getOne(req.supplierId, req.params.listingId);
    return data ? res.status(200).json({ success: true, data }) : missing(res);
  } catch (error) { return failed(res, error); }
}

async function create(req, res) {
  const data = validate(req.body);
  if (!data) return invalid(res);
  try {
    const created = await service.create(req.supplierId, data);
    if (!created) return invalid(res, "Product does not exist or is inactive.");
    return res.status(201).json({ success: true, data: created });
  } catch (error) { return failed(res, error); }
}

async function update(req, res) {
  if (!validId(req.params.listingId)) return invalid(res, "Invalid listing ID.");
  const data = validate(req.body, true);
  if (!data) return invalid(res);
  try {
    const updated = await service.update(req.supplierId, req.params.listingId, data);
    if (updated?.invalidProduct) return invalid(res, "Product does not exist or is inactive.");
    return updated ? res.status(200).json({ success: true, data: updated }) : missing(res);
  } catch (error) { return failed(res, error); }
}

async function hide(req, res) {
  if (!validId(req.params.listingId)) return invalid(res, "Invalid listing ID.");
  try {
    const hidden = await service.hide(req.supplierId, req.params.listingId);
    return hidden ? res.status(200).json({ success: true, message: "Listing hidden." }) : missing(res);
  } catch (error) { return failed(res, error); }
}

module.exports = { getAll, getOne, create, update, hide };
