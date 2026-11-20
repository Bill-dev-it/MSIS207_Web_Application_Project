"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const productService = require("../src/services/product.service");
const controller = require("../src/controllers/product.controller");

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test("getProductsV1 rejects invalid query arrays, unallowlisted sort fields, and bad filters", async () => {
  const cases = [
    [{ page: ["1", "2"] }, "INVALID_QUERY"],
    [{ page: "0", per_page: "12" }, "INVALID_PAGINATION"],
    [{ sort: "price" }, "INVALID_SORT"],
    [{ filter: "not-json" }, "INVALID_FILTER"],
    [{ filter: JSON.stringify([{ key: "price", operator: "=", value: "10" }]) }, "INVALID_FILTER"],
  ];
  for (const [query, expectedCode] of cases) {
    const res = createRes();
    await controller.getProductsV1({ query }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, expectedCode);
  }
});

test("getProductsV1 forwards valid filters and returns exact pagination meta envelope", async () => {
  const original = productService.getProductsCollection;
  let received = null;
  productService.getProductsCollection = async (args) => {
    received = args;
    return { products: [{ product_id: "1" }, { product_id: "2" }], totalItems: 25 };
  };

  try {
    const res = createRes();
    await controller.getProductsV1({
      query: { q: " CFM56 ", sort: "-manufacturer", filter: JSON.stringify([{ key: "product_type", operator: "=", value: "ENGINE" }]), page: "2", per_page: "10" },
    }, res);
    assert.deepEqual(received, { q: "CFM56", sort: "-manufacturer", filter: [{ key: "product_type", operator: "=", value: "ENGINE" }], page: 2, perPage: 10 });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.meta, { page: 2, per_page: 10, total_items: 25, total_pages: 3 });
  } finally {
    productService.getProductsCollection = original;
  }
});

test("getProductById enforces BIGINT ID validation, 404 not found, and 200 response", async () => {
  const original = productService.getProductById;
  productService.getProductById = async (id) => (id === "10" ? { product_id: "10", product_name: "Turbine" } : null);

  try {
    const badId = createRes();
    await controller.getProductById({ params: { productId: "9223372036854775808" } }, badId);
    assert.equal(badId.statusCode, 400);
    assert.equal(badId.body.error.code, "INVALID_PRODUCT_ID");

    const missing = createRes();
    await controller.getProductById({ params: { productId: "999" } }, missing);
    assert.equal(missing.statusCode, 404);
    assert.equal(missing.body.error.code, "PRODUCT_NOT_FOUND");

    const found = createRes();
    await controller.getProductById({ params: { productId: "10" } }, found);
    assert.equal(found.statusCode, 200);
    assert.equal(found.body.data.product_id, "10");
  } finally {
    productService.getProductById = original;
  }
});
