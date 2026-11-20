"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const pool = require("../src/config/db");
const checkoutRepository = require("../src/services/buyer/checkout.repository");

const originalConnect = pool.connect;

function createCheckoutClient({ outOfStock = false } = {}) {
  const executed = [];
  let released = false;
  return {
    executed,
    isReleased: () => released,
    async query(sql, params) {
      executed.push({ sql: sql.trim(), params });
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rowCount: 0, rows: [] };
      if (sql.includes("SELECT cart_id FROM carts")) return { rowCount: 1, rows: [{ cart_id: "10" }] };
      if (sql.includes("checkout_key = $3")) return { rowCount: 0, rows: [] };
      if (sql.includes("SELECT company_name, tax_id FROM companies")) return { rowCount: 1, rows: [{ company_name: "Aero Logistics", tax_id: "TAX-1" }] };
      if (sql.includes("FROM addresses")) return { rowCount: 1, rows: [{ address_id: "1", recipient_name: "Buyer", phone: "555", address_line: "Hangar 4", city: "Seattle", region: "WA", postal_code: "98101", country_code: "US" }] };
      if (sql.includes("FROM cart_items ci")) {
        return { rowCount: 1, rows: [{ cart_item_id: "101", quantity: 2, listing_id: "501", unit_price: "2500.00", stock_quantity: 5, seller_sku: "AP-009", condition: "NEW", listing_status: "ACTIVE", supplier_id: "301", supplier_name: "Precision Aero", supplier_status: "APPROVED", product_name: "Access Panel", part_number: "PN-9", is_active: true }] };
      }
      if (sql.includes("INSERT INTO orders")) return { rowCount: 1, rows: [{ order_id: "701", order_number: "ORD-701", checkout_key: params[3], grand_total: params[11], currency: "USD", created_at: "2026-11-08T10:00:00Z" }] };
      if (sql.includes("INSERT INTO seller_orders")) return { rowCount: 1, rows: [{ seller_order_id: "801" }] };
      if (sql.includes("UPDATE seller_listings sl")) return outOfStock ? { rowCount: 0, rows: [] } : { rowCount: 1, rows: [{ listing_id: "501" }] };
      if (sql.includes("INSERT INTO order_items")) return { rowCount: 1, rows: [{ order_item_id: "901" }] };
      if (sql.includes("INSERT INTO payments")) {
        assert.equal(params[1], "BANK_TRANSFER");
        assert.equal(params[3], "PENDING");
        return { rowCount: 1, rows: [{ payment_id: "991", order_id: "701", payment_method: "BANK_TRANSFER", amount: params[2], status: "PENDING", paid_at: null }] };
      }
      if (sql.includes("DELETE FROM cart_items")) return { rowCount: 1, rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
    release() { released = true; },
  };
}

test.after(async () => {
  pool.connect = originalConnect;
  await pool.end().catch(() => {});
});

test("PostgreSQL 42P08 regression: uncast $4 fails and $4::varchar prepares cleanly on isolated local DB", async (t) => {
  const host = String(pool.options?.host || "");
  const isSafeLocal = ["localhost", "127.0.0.1", "::1"].includes(host) && !process.env.DATABASE_URL;
  if (!isSafeLocal) {
    t.skip("Refusing non-local database target; PostgreSQL 42P08 check skipped.");
    return;
  }

  let client;
  try {
    client = await originalConnect.call(pool);
  } catch {
    t.skip("Local PostgreSQL is unreachable; PostgreSQL 42P08 check skipped.");
    return;
  }

  try {
    await assert.rejects(
      () => client.query("PREPARE test_42p08_uncast AS INSERT INTO payments (order_id, payment_method, amount, status, paid_at) VALUES ($1, $2, $3, $4, CASE WHEN $4 = 'SUCCEEDED' THEN CURRENT_TIMESTAMP ELSE NULL END)"),
      { code: "42P08" }
    );
    await client.query("PREPARE test_42p08_patched AS INSERT INTO payments (order_id, payment_method, amount, status, paid_at) VALUES ($1, $2, $3, $4, CASE WHEN $4::varchar = 'SUCCEEDED' THEN CURRENT_TIMESTAMP ELSE NULL END)");
    await client.query("DEALLOCATE test_42p08_patched");
  } finally {
    await client.query("DEALLOCATE ALL").catch(() => {});
    client.release();
  }
});

test("placeOrderTransaction commits PENDING BANK_TRANSFER on success and rolls back on stock conflict", async () => {
  const input = { userId: "1", companyId: "1", shippingAddressId: "1", billingAddressId: "1", deliveryMethodId: "STANDARD", purchaseReference: "PO-1", paymentMethod: "BANK_TRANSFER", checkoutKey: "key-1" };

  const okClient = createCheckoutClient();
  pool.connect = async () => okClient;
  const result = await checkoutRepository.placeOrderTransaction(input);
  assert.equal(result.created, true);
  assert.equal(result.order.payment_method, "BANK_TRANSFER");
  assert.equal(result.order.payment_status, "PENDING");
  assert.equal(result.order.paid_at, null);
  assert.equal(okClient.executed[0].sql, "BEGIN");
  assert.equal(okClient.executed.at(-1).sql, "COMMIT");
  assert.equal(okClient.isReleased(), true);

  const conflictClient = createCheckoutClient({ outOfStock: true });
  pool.connect = async () => conflictClient;
  await assert.rejects(() => checkoutRepository.placeOrderTransaction(input), { code: "INSUFFICIENT_STOCK", statusCode: 409 });
  assert.equal(conflictClient.executed.at(-1).sql, "ROLLBACK");
  assert.equal(conflictClient.isReleased(), true);
});
