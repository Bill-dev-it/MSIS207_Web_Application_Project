"use strict";

// Request validation only. Never allow clients to choose user IDs, company IDs,
// supplier IDs, active flags, verification flags or the ADMIN role.
const ALLOWED_FIELDS = new Set([
  "account_type", "full_name", "email", "password", "company_name",
  "company_type", "country_code", "tax_id", "store_name"
]);

function nonEmptyString(value, maxLength, minLength = 1) {
  return typeof value === "string" &&
    value.trim().length >= minLength && value.trim().length <= maxLength &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

function validateRegister(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "A JSON object is required." };
  }
  if (Object.keys(body).some((field) => !ALLOWED_FIELDS.has(field))) {
    return { ok: false, message: "Registration contains unsupported fields." };
  }
  const type = body.account_type;
  if (type !== "BUYER" && type !== "SUPPLIER") {
    return { ok: false, message: "account_type must be BUYER or SUPPLIER." };
  }
  if (!nonEmptyString(body.full_name, 150, 2)) {
    return { ok: false, message: "full_name must contain 2–150 characters." };
  }
  if (!nonEmptyString(body.company_name, 255, 2)) {
    return { ok: false, message: "company_name must contain 2–255 characters." };
  }
  if (typeof body.email !== "string" || body.email.length > 254 ||
      !/^[^\s@,<>()]+@[^\s@,<>()]+\.[^\s@,<>()]+$/.test(body.email.trim())) {
    return { ok: false, message: "A valid email address is required." };
  }
  if (typeof body.password !== "string" || body.password.length < 12 ||
      body.password.length > 128 || /\u0000/.test(body.password)) {
    return { ok: false, message: "password must contain 12–128 characters." };
  }
  if (typeof body.country_code !== "string" || !/^[A-Za-z]{2}$/.test(body.country_code)) {
    return { ok: false, message: "country_code must be a two-letter country code." };
  }
  if (body.tax_id !== undefined && body.tax_id !== null &&
      !nonEmptyString(body.tax_id, 100)) {
    return { ok: false, message: "tax_id must contain at most 100 characters." };
  }
  if (type === "BUYER" && !["AIRLINE", "MRO", "MIXED"].includes(body.company_type)) {
    return { ok: false, message: "Buyer company_type must be AIRLINE, MRO or MIXED." };
  }
  if (type === "SUPPLIER") {
    if (body.company_type !== undefined && body.company_type !== "SUPPLIER") {
      return { ok: false, message: "Supplier company_type must be SUPPLIER when provided." };
    }
    if (!nonEmptyString(body.store_name, 150, 2)) {
      return { ok: false, message: "Supplier store_name must contain 2–150 characters." };
    }
  } else if (body.store_name !== undefined) {
    return { ok: false, message: "store_name is only supported for suppliers." };
  }

  return {
    ok: true,
    value: {
      accountType: type,
      fullName: body.full_name.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      companyName: body.company_name.trim(),
      companyType: type === "SUPPLIER" ? "SUPPLIER" : body.company_type,
      countryCode: body.country_code.toUpperCase(),
      taxId: typeof body.tax_id === "string" ? body.tax_id.trim() : null,
      storeName: type === "SUPPLIER" ? body.store_name.trim() : null
    }
  };
}

module.exports = { validateRegister };
