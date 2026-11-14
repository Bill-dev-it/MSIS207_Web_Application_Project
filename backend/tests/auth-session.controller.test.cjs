"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

let loginResult;
const originalLoad = Module._load;
Module._load = function (name, parent, main) {
  if (name === "../../services/auth/session.service" && parent?.filename.endsWith("session.controller.js")) {
    return {
      authenticate: async () => loginResult,
      COOKIE_NAME: "aerorul_session", SESSION_MS: 3600000,
      cookieOptions: () => ({ httpOnly: true, sameSite: "lax", secure: false, path: "/" })
    };
  }
  return originalLoad.call(this, name, parent, main);
};
let controller;
try { controller = require("../src/controllers/auth/session.controller"); }
finally { Module._load = originalLoad; }

function response() {
  return {
    statusCode: 200, data: null, cookies: [], headers: {},
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
    cookie(...args) { this.cookies.push(args); return this; },
    clearCookie(...args) { this.cookies.push(["clear", ...args]); return this; },
    set(key, value) { this.headers[key] = value; return this; }
  };
}

test("Login rejects invalid input", async () => {
  const res = response();
  await controller.login({ body: { email: "invalid", password: "x" } }, res);
  assert.equal(res.statusCode, 400);
});

test("Login sets HttpOnly JWT cookie without returning JWT in JSON", async () => {
  loginResult = { status: "OK", token: "private-jwt", user: { user_id: "7", role: "BUYER" } };
  const res = response();
  await controller.login({ body: { email: "user@example.test", password: "password" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.cookies[0][0], "aerorul_session");
  assert.equal(res.cookies[0][2].httpOnly, true);
  assert.equal(res.cookies[0][2].maxAge, 3600000);
  assert.equal(JSON.stringify(res.data).includes("private-jwt"), false);
});

test("Login rejects wrong password and unverified user", async () => {
  loginResult = { status: "INVALID_CREDENTIALS" };
  const invalid = response();
  await controller.login({ body: { email: "user@example.test", password: "bad" } }, invalid);
  assert.equal(invalid.statusCode, 401);
  loginResult = { status: "EMAIL_NOT_VERIFIED" };
  const unverified = response();
  await controller.login({ body: { email: "user@example.test", password: "password" } }, unverified);
  assert.equal(unverified.statusCode, 403);
});

test("Me returns already authenticated user", () => {
  const res = response();
  controller.me({ authUser: { user_id: "7", role: "BUYER" } }, res);
  assert.equal(res.data.data.user.user_id, "7");
});

test("Logout clears authentication cookie without changing account data", () => {
  const res = response();
  controller.logout({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.cookies[0][0], "clear");
  assert.equal(res.cookies[0][1], "aerorul_session");
});
