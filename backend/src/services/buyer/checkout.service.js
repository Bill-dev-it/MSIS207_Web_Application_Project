"use strict";

const repository = require("./checkout.repository");

const MAX_ID = 9223372036854775807n;
const PAYMENT_METHODS = new Set(["SIMULATION", "BANK_TRANSFER"]);
const ADDRESS_FIELDS = new Set([
  "recipient_name", "phone", "address_line", "city",
  "region", "postal_code", "country_code",
]);

function failure(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

function validId(value) {
  return typeof value === "string" &&
    /^[1-9]\d*$/.test(value) &&
    BigInt(value) <= MAX_ID;
}

function cleanText(value, field, max, required = true) {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null || value === "")) return null;
    failure(400, "INVALID_ADDRESS", `${field} is required.`);
  }
  const clean = value.trim();
  if ((!clean && required) || clean.length > max) {
    failure(400, "INVALID_ADDRESS", `${field} must be ${required ? "non-empty and " : ""}at most ${max} characters.`);
  }
  return clean || null;
}

async function getAddresses(companyId) {
  return repository.getAddresses(companyId);
}

async function addAddress(companyId, body) {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !ADDRESS_FIELDS.has(key))) {
    failure(400, "INVALID_ADDRESS", "Address contains unsupported fields.");
  }
  const countryCode = cleanText(body.country_code, "Country code", 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    failure(400, "INVALID_ADDRESS", "Country code must be a two-letter ISO code.");
  }
  return repository.createAddress(companyId, {
    recipient_name: cleanText(body.recipient_name, "Recipient name", 150),
    phone: cleanText(body.phone, "Phone", 30),
    address_line: cleanText(body.address_line, "Address", 500),
    city: cleanText(body.city, "City", 100),
    region: cleanText(body.region, "Region", 100, false),
    postal_code: cleanText(body.postal_code, "Postal code", 20, false),
    country_code: countryCode,
  });
}

async function getDeliveryMethods() {
  return repository.DELIVERY_METHODS;
}

async function getCompany(companyId) {
  const company = await repository.getCompany(companyId);
  if (!company) failure(404, "COMPANY_NOT_FOUND", "Buyer company was not found.");
  return company;
}

async function placeOrder(details) {
  if (!validId(details.shippingAddressId)) {
    failure(400, "INVALID_SHIPPING_ADDRESS", "Choose a saved shipping address.");
  }
  if (details.billingAddressId != null && !validId(details.billingAddressId)) {
    failure(400, "INVALID_BILLING_ADDRESS", "Choose a saved billing address.");
  }
  if (typeof details.checkoutKey !== "string" ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(details.checkoutKey)) {
    failure(400, "INVALID_CHECKOUT_KEY", "A valid checkout key is required.");
  }
  if (details.purchaseReference != null &&
      (typeof details.purchaseReference !== "string" || details.purchaseReference.trim().length > 100)) {
    failure(400, "INVALID_PURCHASE_REFERENCE", "Purchase reference must be at most 100 characters.");
  }
  if (!PAYMENT_METHODS.has(details.paymentMethod)) {
    failure(400, "UNSUPPORTED_PAYMENT_METHOD", "Payment method must be SIMULATION or BANK_TRANSFER.");
  }
  return repository.placeOrderTransaction({
    ...details,
    purchaseReference: details.purchaseReference?.trim() || null,
  });
}

module.exports = { getAddresses, addAddress, getDeliveryMethods, getCompany, placeOrder };
