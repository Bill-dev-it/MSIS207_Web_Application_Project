"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const log = [];
let failure = null;
let released = 0;
const client = {
  async query(sql, params) {
    log.push({ sql, params });
    if (sql.startsWith("INSERT INTO public.companies")) return { rows: [{ company_id: "48" }] };
    if (sql.startsWith("INSERT INTO public.users")) {
      if (failure === "user") { const e = new Error("duplicate email"); e.code = "23505"; throw e; }
      return { rows: [{ user_id: "1", email: params[2], full_name: params[1], role: params[4] }] };
    }
    if (sql.startsWith("INSERT INTO public.suppliers")) {
      if (failure === "supplier") throw new Error("supplier insertion failure");
      return { rows: [{ supplier_id: "41" }] };
    }
    return { rows: [] };
  },
  release() { released++; }
};
const fakePool = { async connect() { return client; } };
const fakeArgon2 = {
  argon2id: 2,
  async hash(password, options) {
    assert.equal(password, "long-password-1234");
    assert.equal(options.type, 2);
    assert.equal(options.memoryCost, 19456);
    assert.equal(options.timeCost, 2);
    assert.equal(options.parallelism, 1);
    return "argon2-test-hash";
  }
};
const originalLoad = Module._load;
Module._load = function(name, parent, main) {
  if (name === "argon2") return fakeArgon2;
  if (name === "../../config/db" && parent?.filename?.endsWith("register.service.js")) return fakePool;
  return originalLoad.call(this, name, parent, main);
};
let registerAccount;
try { ({ registerAccount } = require("../src/services/auth/register.service")); }
finally { Module._load = originalLoad; }
const base = {
  accountType: "BUYER", fullName: "Buyer Person", email: "buyer@example.test",
  password: "long-password-1234", companyName: "Airline Demo", companyType: "AIRLINE",
  countryCode: "VN", taxId: null, storeName: null
};
test.beforeEach(() => { log.length = 0; failure = null; });
test("BUYER registration inserts only company + user in one transaction", async () => {
  const { account } = await registerAccount(base);
  assert.equal(account.role, "BUYER");
  assert.equal(account.supplier_id, null);
  assert.equal("email_verification_required" in account, false);
  assert.equal(JSON.stringify(account).includes("argon2-test-hash"), false);
  assert.deepEqual(log.filter(x => ["BEGIN", "COMMIT", "ROLLBACK"].includes(x.sql)).map(x => x.sql), ["BEGIN", "COMMIT"]);
  assert.equal(log.filter(x => x.sql.startsWith("INSERT INTO")).length, 2);
  assert.equal(log.some(x => x.sql.includes("public.account_tokens")), false);
  const userInsert = log.find(x => x.sql.startsWith("INSERT INTO public.users"));
  assert.equal(userInsert.params[3], "argon2-test-hash");
  assert.equal(userInsert.params[4], "BUYER");
});
test("SUPPLIER registration creates PENDING supplier in same transaction", async () => {
  const { account } = await registerAccount({ ...base, accountType: "SUPPLIER", companyType: "SUPPLIER", storeName: "My Parts Shop" });
  assert.equal(account.supplier_id, "41");
  const listing = log.find(x => x.sql.startsWith("INSERT INTO public.suppliers"));
  assert.ok(listing.sql.includes("'PENDING'"));
  assert.match(listing.params[2], /^my-parts-shop-[0-9a-f-]{12}$/);
  assert.equal(log.filter(x => x.sql.startsWith("INSERT INTO")).length, 3);
  assert.deepEqual(log.filter(x => ["BEGIN", "COMMIT", "ROLLBACK"].includes(x.sql)).map(x => x.sql), ["BEGIN", "COMMIT"]);
});
test("Failed user insert rolls back company/user", async () => {
  failure = "user";
  await assert.rejects(registerAccount(base), { code: "23505" });
  assert.deepEqual(log.filter(x => ["BEGIN", "COMMIT", "ROLLBACK"].includes(x.sql)).map(x => x.sql), ["BEGIN", "ROLLBACK"]);
});
test("Failed supplier insert rolls back the full registration", async () => {
  failure = "supplier";
  await assert.rejects(registerAccount({ ...base, accountType: "SUPPLIER", companyType: "SUPPLIER", storeName: "My Parts Shop" }), /supplier insertion failure/);
  assert.deepEqual(log.filter(x => ["BEGIN", "COMMIT", "ROLLBACK"].includes(x.sql)).map(x => x.sql), ["BEGIN", "ROLLBACK"]);
  assert.ok(released >= 4);
});
