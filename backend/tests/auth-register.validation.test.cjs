"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRegister } = require("../src/services/auth/register.validation");

const base = {
  account_type: "BUYER", full_name: "Buyer Person", email: "Buyer@Example.test",
  password: "long-password-1234", company_name: "Airline Demo", company_type: "AIRLINE", country_code: "vn"
};
const supplier = {
  account_type: "SUPPLIER", full_name: "Supplier Person", email: "Supplier@Example.test",
  password: "long-password-1234", company_name: "Supplier Demo", country_code: "vn", store_name: "Aero Supply"
};

test("buyer normalizes email and country", () => {
  const r = validateRegister(base);
  assert.equal(r.ok, true);
  assert.equal(r.value.email, "buyer@example.test");
  assert.equal(r.value.countryCode, "VN");
});
test("supplier chooses server-controlled company type", () => {
  const r = validateRegister(supplier);
  assert.equal(r.ok, true);
  assert.equal(r.value.companyType, "SUPPLIER");
  assert.equal(r.value.accountType, "SUPPLIER");
});
test("rejects ADMIN self-registration", () => {
  assert.equal(validateRegister({ ...base, account_type: "ADMIN" }).ok, false);
});
test("rejects client-chosen company/supplier IDs and role", () => {
  for (const extra of ["company_id", "supplier_id", "role", "is_active", "email_verified_at", "auth_version"]) {
    assert.equal(validateRegister({ ...supplier, [extra]: 1 }).ok, false, extra);
  }
});
test("rejects weak and oversized passwords", () => {
  assert.equal(validateRegister({ ...base, password: "short" }).ok, false);
  assert.equal(validateRegister({ ...base, password: "a".repeat(129) }).ok, false);
});
test("rejects supplier without store name", () => {
  const { store_name, ...missing } = supplier;
  assert.equal(validateRegister(missing).ok, false);
});
test("rejects invalid buyer company type and extra store name", () => {
  assert.equal(validateRegister({ ...base, company_type: "SUPPLIER" }).ok, false);
  assert.equal(validateRegister({ ...base, store_name: "not a store" }).ok, false);
});
test("rejects malformed body and invalid email", () => {
  for (const input of [null, [], "text", {}]) assert.equal(validateRegister(input).ok, false);
  assert.equal(validateRegister({ ...base, email: "bad" }).ok, false);
});
