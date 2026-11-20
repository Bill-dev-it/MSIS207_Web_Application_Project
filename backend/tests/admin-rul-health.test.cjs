"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const service = require("../src/services/admin/rul-health.service");
const controller = require("../src/controllers/admin/rul-health.controller");

async function runHealthCheck(fakeFetch, { token = "A".repeat(40), url = "http://127.0.0.1:8000" } = {}) {
  const prev = { fetch: global.fetch, token: process.env.RUL_SERVICE_TOKEN, url: process.env.RUL_SERVICE_URL };
  try {
    if (token === null) delete process.env.RUL_SERVICE_TOKEN;
    else process.env.RUL_SERVICE_TOKEN = token;
    process.env.RUL_SERVICE_URL = url;
    global.fetch = fakeFetch;
    return await service.getHealth();
  } finally {
    global.fetch = prev.fetch;
    if (prev.token === undefined) delete process.env.RUL_SERVICE_TOKEN; else process.env.RUL_SERVICE_TOKEN = prev.token;
    if (prev.url === undefined) delete process.env.RUL_SERVICE_URL; else process.env.RUL_SERVICE_URL = prev.url;
  }
}

test("getHealth returns healthy when local RUL service authenticates and reports model_loaded", async () => {
  const result = await runHealthCheck(async (url, opts) => {
    assert.equal(url.toString(), "http://127.0.0.1:8000/health");
    assert.equal(opts.headers["X-RUL-Service-Token"], "A".repeat(40));
    return {
      ok: true,
      headers: { get: () => "0" },
      async text() { return JSON.stringify({ success: true, data: { status: "healthy", model_loaded: true } }); },
    };
  });
  assert.deepEqual(result, { status: "healthy", model_loaded: true });
  assert.equal(JSON.stringify(result).includes("AAAAA"), false);
});

test("getHealth fails closed without token or on remote HTTP URLs before calling fetch", async () => {
  const noFetch = async () => { throw new Error("Should not call fetch"); };
  assert.deepEqual(await runHealthCheck(noFetch, { token: null }), { status: "unavailable", model_loaded: false });
  assert.deepEqual(await runHealthCheck(noFetch, { url: "http://example.com:8000" }), { status: "unavailable", model_loaded: false });
});

test("getHealth returns unavailable on HTTP error, bad JSON, or network failure and controller returns 200", async () => {
  assert.deepEqual(await runHealthCheck(async () => ({ ok: false, status: 503 })), { status: "unavailable", model_loaded: false });
  assert.deepEqual(await runHealthCheck(async () => ({ ok: true, headers: { get: () => "0" }, async text() { return "not-json"; } })), { status: "unavailable", model_loaded: false });
  assert.deepEqual(await runHealthCheck(async () => { throw new Error("ECONNREFUSED"); }), { status: "unavailable", model_loaded: false });

  const oldGetHealth = service.getHealth;
  try {
    service.getHealth = async () => ({ status: "unavailable", model_loaded: false });
    const res = { statusCode: 0, payload: null, status(c) { this.statusCode = c; return this; }, json(b) { this.payload = b; return this; } };
    await controller.getHealth({}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { success: true, data: { status: "unavailable", model_loaded: false } });
  } finally {
    service.getHealth = oldGetHealth;
  }
});
