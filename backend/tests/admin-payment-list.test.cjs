"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

let queries = [];
let responses = [];
const fakeDb = {
  async query(sql, params) {
    queries.push({ sql, params });
    const result = responses.shift();
    if (!result) throw new Error("Unexpected SQL query.");
    if (result instanceof Error) throw result;
    return result;
  },
};

// Replace only the Admin repository's database dependency during this test.
const originalLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === "../../config/db" && /src[/\\]services[/\\]admin[/\\]/.test(parent?.filename || "")) {
    return fakeDb;
  }
  return originalLoad.call(this, name, parent, isMain);
};

let service;
let controller;
try {
  service = require("../src/services/admin/payment-list.service");
  controller = require("../src/controllers/admin/payment-list.controller");
} finally {
  Module._load = originalLoad;
}

function fakeRows(rows) {
  return { rows };
}

function reset(countRows = [{ total: 0 }], paymentRows = []) {
  queries = [];
  responses = [fakeRows(countRows), fakeRows(paymentRows)];
}

test("Defaults to PENDING bank transfers and converts IDs/amount to strings", async () => {
  reset([{ total: 1 }], [{
    payment_id: "15",
    order_id: "18",
    order_number: "AR-18",
    purchase_reference: "PO-001",
    placed_at: "2026-11-07",
    buyer_company: "Buyer Co",
    payment_method: "BANK_TRANSFER",
    amount: "900719925474099.99",
    currency: "USD",
    status: "PENDING",
    paid_at: null,
  }]);

  const result = await service.listPayments();
  assert.equal(result.status, "PENDING");
  assert.deepEqual(result.pagination, { page: 1, limit: 10, total: 1, totalPages: 1 });
  assert.equal(result.payments[0].order_id, "18");
  assert.equal(result.payments[0].payment_id, "15");
  assert.equal(result.payments[0].amount, "900719925474099.99");
  assert.deepEqual(queries[0].params, ["PENDING"]);
  assert.deepEqual(queries[1].params, ["PENDING", 10, 0]);
});

test("ALL includes every bank transfer status but never simulation payments", async () => {
  reset();
  await service.listPayments({ status: "ALL", page: "2", limit: "5" });
  assert.equal(queries.length, 2);
  assert.match(queries[0].sql, /payment_method = 'BANK_TRANSFER'/);
  assert.match(queries[1].sql, /payment_method = 'BANK_TRANSFER'/);
  assert.doesNotMatch(queries[0].sql, /p\.status\s*=/);
  assert.deepEqual(queries[0].params, []);
  assert.deepEqual(queries[1].params, [5, 5]);
  assert.match(queries[1].sql, /LIMIT \$1 OFFSET \$2/);
});

test("SUCCEEDED and CANCELLED filters are parameterized", async () => {
  for (const status of ["SUCCEEDED", "CANCELLED"]) {
    reset();
    await service.listPayments({ status, page: "1", limit: "20" });
    assert.match(queries[1].sql, /p\.status = \$1/);
    assert.deepEqual(queries[1].params, [status, 20, 0]);
  }
});

test("Invalid status/pagination fails before querying PostgreSQL", async () => {
  for (const input of [
    { status: "HIDDEN" },
    { page: "0" },
    { page: "1.5" },
    { page: "1000001" },
    { limit: "0" },
    { limit: "101" },
    { limit: "1 OR 1=1" },
  ]) {
    queries = [];
    await assert.rejects(
      async () => await service.listPayments(input),
      { statusCode: 400 }
    );
    assert.equal(queries.length, 0);
  }
});

test("List query joins Orders and Buyer Companies and never mutates data", async () => {
  reset();
  await service.listPayments();
  assert.match(queries[1].sql, /JOIN public\.orders o ON o\.order_id = p\.order_id/);
  assert.match(queries[1].sql, /JOIN public\.companies c ON c\.company_id = o\.buyer_company_id/);
  assert.match(queries[1].sql, /ORDER BY o\.created_at DESC/);
  for (const query of queries) {
    assert.match(query.sql.trim(), /^SELECT/);
  }
});

test("Controller rejects repeated status parameters with INVALID_QUERY", async () => {
  const response = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await controller.listPayments({ query: { status: ["PENDING", "ALL"] } }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, "INVALID_QUERY");
});

test("Controller returns data and pagination in the existing response envelope", async () => {
  reset();
  const response = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await controller.listPayments({ query: {} }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data, []);
  assert.deepEqual(response.body.meta.pagination, {
    page: 1, limit: 10, total: 0, totalPages: 0,
  });
});

