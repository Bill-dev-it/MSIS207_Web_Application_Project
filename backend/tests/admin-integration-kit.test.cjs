"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

let queries = [];
let responders = [];
const pool = { query: async (sql, params) => {
  queries.push({ sql, params });
  if (!responders.length) throw Error("Unexpected SQL statement");
  const result = responders.shift();
  if (result instanceof Error) throw result;
  return result;
} };
const original = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === "../../config/db" && /backend[/\\]src[/\\]services[/\\]admin[/\\]/.test(parent?.filename || "")) return pool;
  return original.call(this, name, parent, isMain);
};
let supplierService, dashboardRepository;
try {
  supplierService = require("../src/services/admin/suppliers.service");
  dashboardRepository = require("../src/services/admin/dashboard.repository");
} finally { Module._load = original; }
const rows = x => ({ rows:x });

test("Supplier approval: pending -> approved with conditional parameterized update", async()=>{
  queries=[]; responders=[rows([{supplier_id:"8",status:"APPROVED"}])];
  const data=await supplierService.approveSupplier("8");
  assert.deepEqual(data,{supplier_id:"8",status:"APPROVED",already_approved:false});
  assert.match(queries[0].sql,/status = 'PENDING'/);
  assert.deepEqual(queries[0].params,["8"]);
  assert.equal(queries.length,1);
});

test("Supplier approval: repeated is idempotent", async()=>{
  queries=[]; responders=[rows([]),rows([{supplier_id:"8",status:"APPROVED"}])];
  const data=await supplierService.approveSupplier("8");
  assert.equal(data.already_approved,true);
  assert.equal(queries.length,2);
});

test("Supplier approval: missing supplier returns 404", async()=>{
  queries=[]; responders=[rows([]),rows([])];
  await assert.rejects(()=>supplierService.approveSupplier("8"),{code:"SUPPLIER_NOT_FOUND",statusCode:404});
});

test("Supplier approval: suspended supplier conflicts; does not reactivate", async()=>{
  queries=[]; responders=[rows([]),rows([{supplier_id:"8",status:"SUSPENDED"}])];
  await assert.rejects(()=>supplierService.approveSupplier("8"),{code:"SUPPLIER_STATUS_CONFLICT",statusCode:409});
});

test("Supplier approval: rejects invalid or overflow BIGINT before SQL", async()=>{
  for(const bad of ["0","-1","abc","1.5","9223372036854775808",9]) {
    queries=[];
    await assert.rejects(()=>supplierService.approveSupplier(bad),{code:"INVALID_SUPPLIER_ID",statusCode:400});
    assert.equal(queries.length,0);
  }
});

test("Supplier list: escaped search is parameterized, preserves status default",async()=>{
  queries=[]; responders=[rows([{total:0}]),rows([])];
  const result=await supplierService.listSuppliers({search:"a%b_",limit:"10"});
  assert.equal(result.status,"PENDING");
  assert.equal(queries[0].params[0],"PENDING");
  assert.deepEqual(queries[0].params,["PENDING","%a\\%b\\_%"]);
  assert.match(queries[0].sql,/ESCAPE/);
  assert.deepEqual(queries[1].params,["PENDING","%a\\%b\\_%",10,0]);
});

test("Dashboard aggregation returns real query rows, enforces marketplace-visible listing rules, and exposes succeeded_payment_volume_usd", async () => {
  queries = [];
  responders = [
    rows([
      {
        buyers: 2,
        suppliers_total: 4,
        suppliers_pending: 1,
        suppliers_approved: 3,
        products_active: 10,
        listings_active: 7,
        orders_total: 5,
        payments_pending: 2,
        succeeded_payment_volume_usd: "12500.00",
        predictions_today: 3,
        last_prediction: "2026-11-07T01:00:00.000Z",
        model_version: "fd001-v1",
      },
    ]),
    rows([{ month: "2026-11", total_usd: "12500.00" }]),
  ];

  const data = await dashboardRepository.getSummary();

  assert.equal(data.buyers, 2);
  assert.equal(data.suppliers_pending, 1);
  assert.equal(data.suppliers_approved, 3);
  assert.equal(data.products_active, 10);
  assert.equal(data.listings_active, 7);
  assert.equal(data.payments_pending, 2);
  assert.equal(data.succeeded_payment_volume_usd, "12500.00");
  assert.equal("revenue_settled_usd" in data, false);
  assert.equal(data.sales_trend[0].total_usd, "12500.00");
  assert.equal(queries.length, 2);

  // Verify marketplace-visible active listings joins and filters
  assert.match(queries[0].sql, /FROM public\.seller_listings sl/);
  assert.match(queries[0].sql, /JOIN public\.suppliers s ON s\.supplier_id = sl\.supplier_id/);
  assert.match(queries[0].sql, /JOIN public\.products p ON p\.product_id = sl\.product_id/);
  assert.match(
    queries[0].sql,
    /WHERE sl\.status = 'ACTIVE'[\s\S]*AND s\.status = 'APPROVED'[\s\S]*AND p\.is_active = TRUE/
  );

  // Verify renamed payment volume alias and pending bank transfer filter
  assert.match(queries[0].sql, /AS succeeded_payment_volume_usd/);
  assert.equal(queries[0].sql.includes("revenue_settled_usd"), false);
  assert.match(queries[0].sql, /payment_method = 'BANK_TRANSFER' AND status = 'PENDING'/);
  assert.match(queries[1].sql, /generate_series/);
});
