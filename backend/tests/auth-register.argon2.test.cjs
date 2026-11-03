"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const argon2 = require("argon2");

test("installed Argon2id library hashes and verifies without a database", async () => {
  const plain = "local-test-password-1234";
  const hashed = await argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });
  assert.ok(hashed.startsWith("$argon2id$"));
  assert.equal(await argon2.verify(hashed, plain), true);
  assert.equal(await argon2.verify(hashed, "incorrect-password"), false);
});
