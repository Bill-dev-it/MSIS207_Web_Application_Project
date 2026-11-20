"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const pool = require("../src/config/db");
const requireAdmin = require("../src/middleware/require-admin");
const suppliersController = require("../src/controllers/admin/suppliers.controller");
const suppliersService = require("../src/services/admin/suppliers.service");

const TEST_SECRET = "test-secret-at-least-32-characters-not-for-production";
const originalQuery = pool.query;
const originalSecret = process.env.AUTH_JWT_SECRET;

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

test.beforeEach(() => {
  process.env.AUTH_JWT_SECRET = TEST_SECRET;
});

test.after(() => {
  pool.query = originalQuery;
  if (originalSecret === undefined) delete process.env.AUTH_JWT_SECRET;
  else process.env.AUTH_JWT_SECRET = originalSecret;
});

test("requireAdmin enforces 401 unauthenticated, 403 non-ADMIN, and passes ADMIN GET", async () => {
  const unauthRes = createRes();
  await requireAdmin({ method: "GET", cookies: {}, get: () => undefined }, unauthRes, () => {});
  assert.equal(unauthRes.statusCode, 401);
  assert.equal(unauthRes.body.error.code, "AUTH_REQUIRED");

  const token = jwt.sign({ sub: "1" }, TEST_SECRET, { algorithm: "HS256", expiresIn: "1h" });
  pool.query = async () => ({ rows: [{ user_id: "1", company_id: "1", role: "BUYER", is_active: true }] });
  const buyerRes = createRes();
  await requireAdmin({ method: "GET", cookies: { aerorul_session: token }, get: () => undefined }, buyerRes, () => {});
  assert.equal(buyerRes.statusCode, 403);
  assert.equal(buyerRes.body.error.code, "ADMIN_REQUIRED");

  pool.query = async () => ({ rows: [{ user_id: "1", company_id: "1", role: "ADMIN", is_active: true }] });
  let nextCalled = false;
  const adminRes = createRes();
  await requireAdmin({ method: "GET", cookies: { aerorul_session: token }, get: () => undefined }, adminRes, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test("listSuppliers defaults to PENDING, serializes BIGINT IDs as strings, omits sensitive fields, and rejects bad filters", async () => {
  const sampleRow = {
    supplier_id: 12n, company_id: 25n, store_name: "Pacific Turbine", slug: "pacific-turbine-1",
    description: "Engine spares", logo_object_key: null, status: "PENDING", created_at: "2026-11-06T10:00:00Z",
    company_name: "Pacific Turbine Ltd", company_type: "SUPPLIER", tax_id: "US-99", country_code: "US",
    company_created_at: "2026-11-06T10:00:00Z", contact_user_id: 31n, contact_name: "Dana",
    contact_email: "dana@pacific.test", contact_is_active: true, contact_email_verified_at: null,
    password_hash: "SECRET", auth_version: 3,
  };

  let callIndex = 0;
  pool.query = async () => (++callIndex === 1 ? { rows: [{ total: 1 }] } : { rows: [sampleRow] });

  const res = createRes();
  await suppliersController.listSuppliers({ query: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.meta.status, "PENDING");
  assert.equal(res.body.data[0].supplier_id, "12");
  assert.equal(res.body.data[0].company_id, "25");
  assert.equal(res.body.data[0].contact_user_id, "31");
  assert.equal("password_hash" in res.body.data[0], false);
  assert.equal("auth_version" in res.body.data[0], false);

  const badStatusRes = createRes();
  await suppliersController.listSuppliers({ query: { status: "REJECTED" } }, badStatusRes);
  assert.equal(badStatusRes.statusCode, 400);
  assert.equal(badStatusRes.body.error.code, "INVALID_STATUS");
});

test("approveSupplier handles PENDING->APPROVED, idempotent replay, missing 404, and SUSPENDED 409 conflict", async () => {
  pool.query = async () => ({ rows: [{ supplier_id: "8", status: "APPROVED" }] });
  assert.deepEqual(await suppliersService.approveSupplier("8"), {
    supplier_id: "8", status: "APPROVED", already_approved: false,
  });

  let step = 0;
  pool.query = async () => (++step === 1 ? { rows: [] } : { rows: [{ supplier_id: "8", status: "APPROVED" }] });
  assert.equal((await suppliersService.approveSupplier("8")).already_approved, true);

  pool.query = async () => ({ rows: [] });
  await assert.rejects(() => suppliersService.approveSupplier("8"), { code: "SUPPLIER_NOT_FOUND", statusCode: 404 });

  step = 0;
  pool.query = async () => (++step === 1 ? { rows: [] } : { rows: [{ supplier_id: "8", status: "SUSPENDED" }] });
  await assert.rejects(() => suppliersService.approveSupplier("8"), { code: "SUPPLIER_STATUS_CONFLICT", statusCode: 409 });
});
