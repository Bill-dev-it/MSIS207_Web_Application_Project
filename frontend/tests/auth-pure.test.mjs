import test from "node:test";
import assert from "node:assert/strict";
import { buildRegistrationPayload } from "../src/screens/auth/registerFields.js";
import { postLoginDestination } from "../src/auth/roleRoutes.js";

const base = {
  account_type: "BUYER", full_name: "  A User  ", email: "ME@EXAMPLE.COM ",
  password: "password12345", confirm_password: "password12345",
  company_name: " Aero  ", company_type: "MRO", country_code: "vn", tax_id: "", store_name: "",
};

test("Buyer registration sends only backend-accepted fields and normalizes text", () => {
  assert.deepEqual(buildRegistrationPayload(base), {
    account_type: "BUYER", full_name: "A User", email: "me@example.com", password: "password12345",
    company_name: "Aero", company_type: "MRO", country_code: "VN",
  });
});
test("Supplier registration includes store name and no client-chosen company IDs", () => {
  const payload = buildRegistrationPayload({ ...base, account_type: "SUPPLIER", store_name: " Parts Hub ", tax_id: "  VN12  ", supplier_id: 39, company_id: 2 });
  assert.equal(payload.company_type, "SUPPLIER");
  assert.equal(payload.store_name, "Parts Hub");
  assert.equal(payload.tax_id, "VN12");
  assert.equal(payload.supplier_id, undefined);
  assert.equal(payload.company_id, undefined);
});
test("role landing paths accept only same-role internal destinations", () => {
  assert.equal(postLoginDestination("BUYER", "/buyer/orders"), "/buyer/orders");
  assert.equal(postLoginDestination("BUYER", "/supplier"), "/buyer");
  assert.equal(postLoginDestination("SUPPLIER", "/supplier/listings"), "/supplier/listings");
  assert.equal(postLoginDestination("SUPPLIER", "/supplier-admin"), "/supplier");
  assert.equal(postLoginDestination("ADMIN", "//attacker.test"), "/admin");
  assert.equal(postLoginDestination("ADMIN", "/admin\\bad"), "/admin");
});
