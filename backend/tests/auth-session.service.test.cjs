"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const user = {
  user_id: "7", company_id: "3", full_name: "Example",
  email: "example@test.invalid", role: "SUPPLIER",
  password_hash: "stored-argon2-hash", is_active: true,
  email_verified_at: "2026-01-01T00:00:00Z"
};
let rows = [user];
let passwordMatches = true;
let verifiedPayload = { sub: "7" };
let verifyThrows = false;
let lastQuery;
let lastSign;

const originalLoad = Module._load;
Module._load = function (name, parent, main) {
  if (name === "argon2") {
    return { verify: async (hash, password) => {
      assert.equal(hash, "stored-argon2-hash");
      assert.equal(typeof password, "string");
      return passwordMatches;
    } };
  }
  if (name === "jsonwebtoken") {
    return {
      sign: (payload, secret, options) => {
        lastSign = { payload, secret, options };
        return "signed-jwt";
      },
      verify: (token, secret, options) => {
        assert.equal(token, "signed-jwt");
        assert.equal(typeof secret, "string");
        assert.deepEqual(options.algorithms, ["HS256"]);
        if (verifyThrows) throw new Error("jwt expired or invalid");
        return verifiedPayload;
      }
    };
  }
  if (name.endsWith("config/db")) return {
    query: async (sql, args) => {
      lastQuery = { sql, args };
      return { rows };
    }
  };
  return originalLoad.call(this, name, parent, main);
};
let session;
try { session = require("../src/services/auth/session.service"); }
finally { Module._load = originalLoad; }

const previousSecret = process.env.AUTH_JWT_SECRET;
process.env.AUTH_JWT_SECRET = "test-secret-at-least-32-characters-not-for-production";
test.after(() => {
  if (previousSecret === undefined) delete process.env.AUTH_JWT_SECRET;
  else process.env.AUTH_JWT_SECRET = previousSecret;
});

test.beforeEach(() => {
  rows = [user];
  passwordMatches = true;
  verifiedPayload = { sub: "7" };
  verifyThrows = false;
  lastQuery = null;
  lastSign = null;
});

test("Login uses Argon2 verify and issues a 1-hour JWT with user ID", async () => {
  const result = await session.authenticate(user.email, "password");
  assert.equal(result.status, "OK");
  assert.equal(result.token, "signed-jwt");
  assert.deepEqual(lastSign.payload, { sub: "7" });
  assert.equal(lastSign.options.expiresIn, "1h");
  assert.equal(lastSign.options.algorithm, "HS256");
  assert.equal(result.user.password_hash, undefined);
  assert.deepEqual(lastQuery.args, [user.email]);
});

test("Login rejects unknown user and wrong password", async () => {
  rows = [];
  assert.equal((await session.authenticate(user.email, "bad")).status, "INVALID_CREDENTIALS");
  rows = [user];
  passwordMatches = false;
  assert.equal((await session.authenticate(user.email, "bad")).status, "INVALID_CREDENTIALS");
});

test("Login rejects disabled and unverified users", async () => {
  rows = [{ ...user, is_active: false }];
  assert.equal((await session.authenticate(user.email, "password")).status, "ACCOUNT_DISABLED");
  rows = [{ ...user, email_verified_at: null }];
  assert.equal((await session.authenticate(user.email, "password")).status, "EMAIL_NOT_VERIFIED");
});

test("Auth reads current role/company from PostgreSQL after verifying JWT", async () => {
  const result = await session.getAuthenticatedUser("signed-jwt");
  assert.equal(result.user_id, "7");
  assert.equal(result.company_id, "3");
  assert.equal(result.role, "SUPPLIER");
  assert.deepEqual(lastQuery.args, ["7"]);
});

test("Auth rejects missing/invalid/expired JWT and missing/disabled users", async () => {
  assert.equal(await session.getAuthenticatedUser(null), null);
  verifyThrows = true;
  assert.equal(await session.getAuthenticatedUser("signed-jwt"), null);
  verifyThrows = false;
  verifiedPayload = { sub: "abc" };
  assert.equal(await session.getAuthenticatedUser("signed-jwt"), null);
  verifiedPayload = { sub: "7" };
  rows = [];
  assert.equal(await session.getAuthenticatedUser("signed-jwt"), null);
  rows = [{ ...user, is_active: false }];
  assert.equal(await session.getAuthenticatedUser("signed-jwt"), null);
});

test("Missing JWT secret is rejected", async () => {
  delete process.env.AUTH_JWT_SECRET;
  await assert.rejects(() => session.authenticate(user.email, "password"),
    (error) => error.code === "AUTH_NOT_CONFIGURED");
  process.env.AUTH_JWT_SECRET = "test-secret-at-least-32-characters-not-for-production";
});
