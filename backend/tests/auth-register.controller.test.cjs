"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

let mode = "OK";
let calls = 0;
let valid = true;
const originalLoad = Module._load;
Module._load = function (name, parent, main) {
  if (name === "../../services/auth/register.service" && parent?.filename?.endsWith("register.controller.js")) {
    return { registerAccount: async () => {
      calls++;
      if (mode === "DUPLICATE") { const error = new Error("Duplicate"); error.code = "23505"; throw error; }
      if (mode === "INVALID_DB") { const error = new Error("Invalid input"); error.code = "23514"; throw error; }
      return { account: { user_id: "1", company_id: "48", supplier_id: null,
        full_name: "Buyer Person", email: "buyer@example.test", role: "BUYER" } };
    } };
  }
  if (name === "../../services/auth/register.validation" && parent?.filename?.endsWith("register.controller.js")) {
    return { validateRegister: () => valid ? { ok: true, value: {} } : { ok: false, message: "Bad request" } };
  }
  return originalLoad.call(this, name, parent, main);
};
let register;
try { ({ register } = require("../src/controllers/auth/register.controller")); }
finally { Module._load = originalLoad; }
function response() {
  return { statusCode: 0, payload: null,
    status(n) { this.statusCode = n; return this; },
    json(data) { this.payload = data; return this; } };
}
test.beforeEach(() => { mode = "OK"; calls = 0; valid = true; });
test("MVP registration creates account without SMTP and returns no verification fields", async () => {
  const saved = Object.fromEntries(["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"].map(k => [k, process.env[k]]));
  try {
    for (const key of Object.keys(saved)) delete process.env[key];
    const res = response(); await register({ body: {} }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.success, true);
    assert.equal(res.payload.data.role, "BUYER");
    assert.equal(calls, 1);
    assert.equal("email_verification_required" in res.payload.data, false);
    assert.equal("email_verification_sent" in res.payload.data, false);
    assert.equal("password_hash" in res.payload.data, false);
  } finally { for (const [key, val] of Object.entries(saved)) {
    if (val === undefined) delete process.env[key]; else process.env[key] = val;
  } }
});
test("MVP invalid input is rejected before database access", async () => {
  valid = false;
  const res = response(); await register({ body: {} }, res);
  assert.equal(res.statusCode, 400); assert.equal(calls, 0);
});
test("MVP duplicate email returns 409", async () => {
  mode = "DUPLICATE";
  const res = response(); await register({ body: {} }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.payload.error.code, "ACCOUNT_CONFLICT");
});
test("MVP database constraint errors return 400", async () => {
  mode = "INVALID_DB";
  const res = response(); await register({ body: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.error.code, "INVALID_INPUT");
});
