"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const listingsService = require("../src/services/supplier/listings.service");
const controller = require("../src/controllers/supplier/listings.controller");

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

const VALID_BODY = {
  product_id: 12, seller_sku: " SKU-CFM56-01 ", condition: "NEW",
  price: "125000.50", stock_quantity: 4, lead_time_days: 7, status: "ACTIVE",
};

test("create validates complete payload and normalizes listing fields under supplierId scope", async () => {
  const original = listingsService.create;
  let captured = null;
  listingsService.create = async (supplierId, data) => {
    captured = { supplierId, data };
    return { listing_id: "88", ...data };
  };

  try {
    const { status: _omitted, ...incomplete } = VALID_BODY;
    const missingRes = createRes();
    await controller.create({ supplierId: "5", body: incomplete }, missingRes);
    assert.equal(missingRes.statusCode, 400);
    assert.equal(missingRes.body.error.code, "INVALID_INPUT");

    const okRes = createRes();
    await controller.create({ supplierId: "5", body: VALID_BODY }, okRes);
    assert.equal(okRes.statusCode, 201);
    assert.equal(captured.supplierId, "5");
    assert.equal(captured.data.product_id, "12");
    assert.equal(captured.data.seller_sku, "SKU-CFM56-01");
  } finally {
    listingsService.create = original;
  }
});

test("update validates fields and accepts valid partial patches", async () => {
  const original = listingsService.update;
  let captured = null;
  listingsService.update = async (supplierId, listingId, data) => {
    captured = { supplierId, listingId, data };
    return { listing_id: listingId, ...data };
  };

  try {
    const emptyRes = createRes();
    await controller.update({ supplierId: "5", params: { listingId: "10" }, body: {} }, emptyRes);
    assert.equal(emptyRes.statusCode, 400);

    const badPriceRes = createRes();
    await controller.update({ supplierId: "5", params: { listingId: "10" }, body: { price: "10.123" } }, badPriceRes);
    assert.equal(badPriceRes.statusCode, 400);

    const okRes = createRes();
    await controller.update({ supplierId: "5", params: { listingId: "10" }, body: { price: 0, stock_quantity: 0, status: "HIDDEN" } }, okRes);
    assert.equal(okRes.statusCode, 200);
    assert.deepEqual(captured, { supplierId: "5", listingId: "10", data: { price: "0", stock_quantity: 0, status: "HIDDEN" } });
  } finally {
    listingsService.update = original;
  }
});

test("controller maps duplicate SKU 23505 to 409 and missing listings to 404", async () => {
  const origCreate = listingsService.create;
  const origGetOne = listingsService.getOne;
  const origHide = listingsService.hide;
  listingsService.create = async () => { const err = new Error("dup"); err.code = "23505"; throw err; };
  listingsService.getOne = async () => null;
  listingsService.hide = async () => false;

  try {
    const dupRes = createRes();
    await controller.create({ supplierId: "5", body: VALID_BODY }, dupRes);
    assert.equal(dupRes.statusCode, 409);
    assert.equal(dupRes.body.error.code, "DUPLICATE_SKU");

    const getRes = createRes();
    await controller.getOne({ supplierId: "5", params: { listingId: "10" } }, getRes);
    assert.equal(getRes.statusCode, 404);
    assert.equal(getRes.body.error.code, "LISTING_NOT_FOUND");

    const hideRes = createRes();
    await controller.hide({ supplierId: "5", params: { listingId: "10" } }, hideRes);
    assert.equal(hideRes.statusCode, 404);
  } finally {
    listingsService.create = origCreate;
    listingsService.getOne = origGetOne;
    listingsService.hide = origHide;
  }
});
