"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const service = require("../src/services/admin/rul-health.service");
const controller = require("../src/controllers/admin/rul-health.controller");

// Tests use a fake FastAPI response; no network or PostgreSQL mutations.
async function check(fakeFetch, { token = "A".repeat(40), url = "http://127.0.0.1:8000" } = {}) {
  const old = {
    fetch: global.fetch,
    token: process.env.RUL_SERVICE_TOKEN,
    url: process.env.RUL_SERVICE_URL,
  };
  try {
    if (token === null) delete process.env.RUL_SERVICE_TOKEN;
    else process.env.RUL_SERVICE_TOKEN = token;
    process.env.RUL_SERVICE_URL = url;
    global.fetch = fakeFetch;
    return await service.getHealth();
  } finally {
    global.fetch = old.fetch;
    if (old.token === undefined) delete process.env.RUL_SERVICE_TOKEN;
    else process.env.RUL_SERVICE_TOKEN = old.token;
    if (old.url === undefined) delete process.env.RUL_SERVICE_URL;
    else process.env.RUL_SERVICE_URL = old.url;
  }
}

function healthyResponse() {
  return {
    ok: true,
    headers: { get: () => "0" },
    async text() {
      return JSON.stringify({ success: true, data: { status: "healthy", model_loaded: true } });
    },
  };
}

test("Reports healthy only for authenticated loaded-model response", async () => {
  let calls = 0;
  const result = await check(async (url, options) => {
    calls++;
    assert.equal(url.toString(), "http://127.0.0.1:8000/health");
    assert.equal(options.headers["X-RUL-Service-Token"], "A".repeat(40));
    assert.equal(options.method, "GET");
    assert.equal(options.redirect, "error");
    return healthyResponse();
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { status: "healthy", model_loaded: true });
  assert.equal(JSON.stringify(result).includes("AAAAA"), false);
});

test("Missing service token returns unavailable and does not call FastAPI", async () => {
  const result = await check(async () => { throw Error("Should not fetch"); }, { token: null });
  assert.deepEqual(result, { status: "unavailable", model_loaded: false });
});

test("Remote HTTP endpoint is rejected before sending credentials", async () => {
  const result = await check(async () => { throw Error("Should not fetch"); }, {
    url: "http://example.com:8000",
  });
  assert.deepEqual(result, { status: "unavailable", model_loaded: false });
});

test("A failed upstream health response is not reported as healthy", async () => {
  const result = await check(async () => ({ ok: false, status: 503 }));
  assert.deepEqual(result, { status: "unavailable", model_loaded: false });
});

test("Missing model_loaded=true is not reported as healthy", async () => {
  const result = await check(async () => ({
    ok: true,
    headers: { get: () => "0" },
    async text() { return JSON.stringify({ success: true, data: { status: "healthy" } }); },
  }));
  assert.deepEqual(result, { status: "unavailable", model_loaded: false });
});

test("Malformed response JSON becomes unavailable", async () => {
  const result = await check(async () => ({
    ok: true,
    headers: { get: () => "0" },
    async text() { return "not-json"; },
  }));
  assert.deepEqual(result, { status: "unavailable", model_loaded: false });
});

test("Oversized response is rejected", async () => {
  const result = await check(async () => ({
    ok: true,
    headers: { get: () => "0" },
    async text() { return "x".repeat(4097); },
  }));
  assert.deepEqual(result, { status: "unavailable", model_loaded: false });
});

test("Network failure becomes unavailable", async () => {
  const result = await check(async () => { throw Error("ECONNREFUSED"); });
  assert.deepEqual(result, { status: "unavailable", model_loaded: false });
});

test("Controller returns sanitized response with monitoring status", async () => {
  const oldGetHealth = service.getHealth;
  try {
    service.getHealth = async () => ({ status: "unavailable", model_loaded: false });
    const res = {
      statusCode: 0,
      payload: null,
      status(code) { this.statusCode = code; return this; },
      json(value) { this.payload = value; return this; },
    };
    await controller.getHealth({}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, {
      success: true, data: { status: "unavailable", model_loaded: false },
    });
  } finally {
    service.getHealth = oldGetHealth;
  }
});

