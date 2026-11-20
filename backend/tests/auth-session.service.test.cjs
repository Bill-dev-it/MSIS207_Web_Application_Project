"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const pool = require("../src/config/db");
const session = require("../src/services/auth/session.service");

const TEST_SECRET = "test-secret-at-least-32-characters-not-for-production";
const originalQuery = pool.query;
const originalSecret = process.env.AUTH_JWT_SECRET;

let passwordHash;
let nextRows = [];

test.before(async () => {
  passwordHash = await argon2.hash("correct-password");
});

test.beforeEach(() => {
  process.env.AUTH_JWT_SECRET = TEST_SECRET;
  nextRows = [{
    user_id: "7", company_id: "3", full_name: "Example User",
    email: "example@test.invalid", role: "SUPPLIER",
    password_hash: passwordHash, is_active: true,
  }];
  pool.query = async () => ({ rows: nextRows });
});

test.after(() => {
  pool.query = originalQuery;
  if (originalSecret === undefined) delete process.env.AUTH_JWT_SECRET;
  else process.env.AUTH_JWT_SECRET = originalSecret;
});

test("authenticate issues a real 1-hour HS256 JWT without exposing password_hash", async () => {
  const result = await session.authenticate("example@test.invalid", "correct-password");
  assert.equal(result.status, "OK");
  assert.equal(result.user.password_hash, undefined);

  const decoded = jwt.verify(result.token, TEST_SECRET, { algorithms: ["HS256"] });
  assert.equal(decoded.sub, "7");
  assert.equal(decoded.exp - decoded.iat, 3600);
});

test("authenticate rejects unknown user, wrong password, and disabled accounts", async () => {
  nextRows = [];
  assert.equal((await session.authenticate("missing@test.invalid", "correct-password")).status, "INVALID_CREDENTIALS");

  nextRows = [{ user_id: "7", password_hash: passwordHash, is_active: true }];
  assert.equal((await session.authenticate("example@test.invalid", "wrong-password")).status, "INVALID_CREDENTIALS");

  nextRows = [{ user_id: "7", password_hash: passwordHash, is_active: false }];
  assert.equal((await session.authenticate("example@test.invalid", "correct-password")).status, "ACCOUNT_DISABLED");
});

test("getAuthenticatedUser verifies JWT and returns active user from database", async () => {
  const validToken = jwt.sign({ sub: "7" }, TEST_SECRET, { algorithm: "HS256", expiresIn: "1h" });
  const user = await session.getAuthenticatedUser(validToken);
  assert.deepEqual(user, {
    user_id: "7", company_id: "3", full_name: "Example User",
    email: "example@test.invalid", role: "SUPPLIER",
  });

  const expiredToken = jwt.sign({ sub: "7" }, TEST_SECRET, { algorithm: "HS256", expiresIn: -10 });
  assert.equal(await session.getAuthenticatedUser(expiredToken), null);
  assert.equal(await session.getAuthenticatedUser("tampered.token.value"), null);

  nextRows = [{ ...nextRows[0], is_active: false }];
  assert.equal(await session.getAuthenticatedUser(validToken), null);
});

test("authenticate rejects missing AUTH_JWT_SECRET configuration", async () => {
  delete process.env.AUTH_JWT_SECRET;
  await assert.rejects(
    () => session.authenticate("example@test.invalid", "correct-password"),
    { code: "AUTH_NOT_CONFIGURED" }
  );
});
