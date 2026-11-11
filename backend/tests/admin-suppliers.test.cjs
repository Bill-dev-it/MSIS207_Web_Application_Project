"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const originalLoad = Module._load;
let mockAuthUser = null;
let mockAuthError = null;
let recordedQueries = [];
let mockTotal = 0;
let mockRows = [];
let mockDbError = null;

Module._load = function (name, parent, main) {
  if (
    name === "./require-auth" &&
    parent?.filename.endsWith("require-admin.js")
  ) {
    return {
      requireAuth: async (req, res, next) => {
        if (mockAuthError) {
          return res.status(401).json({
            success: false,
            error: {
              code: "AUTH_REQUIRED",
              message: "Authentication is required.",
            },
          });
        }
        req.authUser = mockAuthUser;
        return next();
      },
    };
  }
  if (
    name === "../../config/db" &&
    parent?.filename.endsWith("suppliers.repository.js")
  ) {
    return {
      query: async (sql, params) => {
        if (mockDbError) throw mockDbError;
        recordedQueries.push({ sql, params });
        if (sql.includes("COUNT(*)")) {
          return { rows: [{ total: mockTotal }] };
        }
        return { rows: mockRows };
      },
    };
  }
  return originalLoad.call(this, name, parent, main);
};

let requireAdmin;
let suppliersController;
try {
  requireAdmin = require("../src/middleware/require-admin");
  suppliersController = require("../src/controllers/admin/suppliers.controller");
} finally {
  Module._load = originalLoad;
}

async function runMiddleware(middleware, req) {
  const res = createRes();
  let nextCalled = false;
  await middleware(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

test("Admin Suppliers Auth: unauthenticated GET is rejected with 401 AUTH_REQUIRED", async () => {
  mockAuthError = true;
  mockAuthUser = null;
  const { res, nextCalled } = await runMiddleware(requireAdmin, {
    method: "GET",
    get: () => undefined,
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, "AUTH_REQUIRED");
});

test("Admin Suppliers Auth: BUYER and SUPPLIER roles are rejected with 403 ADMIN_REQUIRED", async () => {
  mockAuthError = false;
  for (const role of ["BUYER", "SUPPLIER"]) {
    mockAuthUser = { user_id: "10", company_id: "4", role };
    const { res, nextCalled } = await runMiddleware(requireAdmin, {
      method: "GET",
      get: () => undefined,
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "ADMIN_REQUIRED");
  }
});

test("Admin Suppliers Auth: ADMIN role passes requireAdmin for GET without mutation headers", async () => {
  mockAuthError = false;
  mockAuthUser = { user_id: "1", company_id: "1", role: "ADMIN" };
  const { res, nextCalled } = await runMiddleware(requireAdmin, {
    method: "GET",
    get: () => undefined,
  });
  assert.equal(nextCalled, true);
  assert.equal(res.body, null);
});

test("GET /api/v1/admin/suppliers: defaults to status=PENDING, page=1, limit=10 and formats BIGINT IDs as strings without sensitive fields", async () => {
  recordedQueries = [];
  mockDbError = null;
  mockTotal = 1;
  mockRows = [
    {
      supplier_id: 12n,
      company_id: 25n,
      store_name: "Pacific Turbine Spares",
      slug: "pacific-turbine-spares-a1b2c3d4e5f6",
      description: "Engine accessories supplier",
      logo_object_key: null,
      status: "PENDING",
      created_at: "2026-11-06T10:00:00.000Z",
      company_name: "Pacific Turbine Spares Ltd.",
      company_type: "SUPPLIER",
      tax_id: "US-99-1234567",
      country_code: "US",
      company_created_at: "2026-11-06T10:00:00.000Z",
      contact_user_id: 31n,
      contact_name: "Dana Rivera",
      contact_email: "dana@pacificturbine.example",
      contact_is_active: true,
      contact_email_verified_at: "2026-11-06T10:05:00.000Z",
      password_hash: "SHOULD_NEVER_BE_INCLUDED",
      auth_version: 3,
    },
  ];

  const res = createRes();
  await suppliersController.listSuppliers({ query: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.count, 1);
  assert.equal(res.body.meta.status, "PENDING");
  assert.deepEqual(res.body.meta.pagination, {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  });

  const item = res.body.data[0];
  assert.equal(item.supplier_id, "12");
  assert.equal(item.company_id, "25");
  assert.equal(item.contact_user_id, "31");
  assert.equal(item.status, "PENDING");
  assert.equal("password_hash" in item, false);
  assert.equal("auth_version" in item, false);

  assert.equal(recordedQueries.length, 2);
  assert.deepEqual(recordedQueries[0].params, ["PENDING"]);
  assert.deepEqual(recordedQueries[1].params, ["PENDING", 10, 0]);
  assert.equal(recordedQueries[1].sql.includes("password_hash"), false);
  assert.equal(recordedQueries[1].sql.includes("auth_version"), false);
  assert.equal(recordedQueries[1].sql.includes("account_tokens"), false);
});

test("GET /api/v1/admin/suppliers: accepts APPROVED and SUSPENDED with custom pagination", async () => {
  for (const status of ["APPROVED", "SUSPENDED"]) {
    recordedQueries = [];
    mockDbError = null;
    mockTotal = 25;
    mockRows = [];

    const res = createRes();
    await suppliersController.listSuppliers(
      { query: { status, page: "3", limit: "5" } },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.meta.status, status);
    assert.deepEqual(res.body.meta.pagination, {
      page: 3,
      limit: 5,
      total: 25,
      totalPages: 5,
    });
    assert.deepEqual(recordedQueries[0].params, [status]);
    assert.deepEqual(recordedQueries[1].params, [status, 5, 10]);
  }
});

test("GET /api/v1/admin/suppliers: rejects unsupported status values with 400 INVALID_STATUS", async () => {
  for (const invalidStatus of ["ALL", "REJECTED", "pending", "", "ACTIVE"]) {
    recordedQueries = [];
    const res = createRes();
    await suppliersController.listSuppliers(
      { query: { status: invalidStatus } },
      res
    );
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "INVALID_STATUS");
    assert.equal(recordedQueries.length, 0);
  }
});

test("GET /api/v1/admin/suppliers: rejects non-string query parameters with 400 INVALID_QUERY", async () => {
  recordedQueries = [];
  const res = createRes();
  await suppliersController.listSuppliers(
    { query: { status: ["PENDING", "APPROVED"] } },
    res
  );
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, "INVALID_QUERY");
  assert.equal(recordedQueries.length, 0);
});

test("GET /api/v1/admin/suppliers: rejects invalid pagination with 400 INVALID_PAGINATION", async () => {
  const invalidCases = [
    { page: "0", limit: "10" },
    { page: "-1", limit: "10" },
    { page: "1000001", limit: "10" },
    { page: "abc", limit: "10" },
    { page: "1", limit: "0" },
    { page: "1", limit: "101" },
    { page: "1", limit: "10.5" },
  ];
  for (const query of invalidCases) {
    recordedQueries = [];
    const res = createRes();
    await suppliersController.listSuppliers({ query }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "INVALID_PAGINATION");
    assert.equal(recordedQueries.length, 0);
  }
});

test("GET /api/v1/admin/suppliers: returns generic 500 INTERNAL_SERVER_ERROR on database failure", async () => {
  mockDbError = new Error("connection refused: secret_db_host");
  const res = createRes();
  await suppliersController.listSuppliers({ query: {} }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, "INTERNAL_SERVER_ERROR");
  assert.equal(res.body.error.message, "Unable to retrieve supplier records.");
  assert.equal(JSON.stringify(res.body).includes("secret_db_host"), false);
  mockDbError = null;
});

