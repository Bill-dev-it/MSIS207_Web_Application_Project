"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const originalLoad = Module._load;
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
    if (sql.startsWith("INSERT INTO public.suppliers")) return { rows: [{ supplier_id: "41" }] };
    if (sql.startsWith("INSERT INTO public.account_tokens")) {
      if (failure === "token") throw new Error("token insertion failure");
      return { rows: [] };
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
    return "argon2-test-hash";
  }
};

Module._load = function(name, parent, main) {
  if (name === "argon2") return fakeArgon2;
  if (name === "../../config/db" &&
      (parent?.filename?.endsWith("register.service.js") || parent?.filename?.endsWith("verification-token.service.js"))) return fakePool;
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

test("BUYER inserts company + user + hashed email token in one transaction", async () => {
  log.length = 0;
  const { account, verificationToken } = await registerAccount(base);
  assert.equal(account.role, "BUYER");
  assert.equal(account.supplier_id, null);
  assert.equal(account.email_verification_required, true);
  assert.match(verificationToken, /^[0-9a-f]{64}$/);
  assert.deepEqual(log.filter(x => ["BEGIN", "COMMIT", "ROLLBACK"].includes(x.sql)).map(x => x.sql), ["BEGIN", "COMMIT"]);
  assert.equal(log.filter(x => x.sql.startsWith("INSERT INTO")).length, 3);
  const userInsert = log.find(x => x.sql.startsWith("INSERT INTO public.users"));
  assert.equal(userInsert.params[3], "argon2-test-hash");
  assert.equal(userInsert.params[4], "BUYER");
  const tokenInsert = log.find(x => x.sql.startsWith("INSERT INTO public.account_tokens"));
  assert.equal(tokenInsert.params[1].length, 64);
  assert.notEqual(tokenInsert.params[1], verificationToken, "raw token must NEVER be stored");
  assert.equal(JSON.stringify(account).includes(verificationToken), false);
  assert.equal(JSON.stringify(account).includes("argon2-test-hash"), false);
});

test("SUPPLIER remains PENDING and gets token in same transaction", async () => {
  log.length = 0;
  const { account } = await registerAccount({ ...base, accountType: "SUPPLIER", companyType: "SUPPLIER", storeName: "My Parts Shop" });
  assert.equal(account.supplier_id, "41");
  const listing = log.find(x => x.sql.startsWith("INSERT INTO public.suppliers"));
  assert.ok(listing.sql.includes("'PENDING'"));
  assert.match(listing.params[2], /^my-parts-shop-[0-9a-f-]{12}$/);
  assert.deepEqual(log.filter(x => ["BEGIN", "COMMIT", "ROLLBACK"].includes(x.sql)).map(x => x.sql), ["BEGIN", "COMMIT"]);
});

test("failed user insert rolls back all registration", async () => {
  log.length = 0;
  failure = "user";
  await assert.rejects(registerAccount(base), { code: "23505" });
  failure = null;
  assert.deepEqual(log.filter(x => ["BEGIN", "COMMIT", "ROLLBACK"].includes(x.sql)).map(x => x.sql), ["BEGIN", "ROLLBACK"]);
});

test("failed token insert also rolls back company/user/supplier", async () => {
  log.length = 0;
  failure = "token";
  await assert.rejects(registerAccount(base), /token insertion failure/);
  failure = null;
  assert.deepEqual(log.filter(x => ["BEGIN", "COMMIT", "ROLLBACK"].includes(x.sql)).map(x => x.sql), ["BEGIN", "ROLLBACK"]);
  assert.ok(released >= 4);
});
