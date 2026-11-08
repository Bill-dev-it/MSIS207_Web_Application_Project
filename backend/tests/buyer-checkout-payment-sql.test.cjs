"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Source inspection: checkout.repository.js uses explicit $4::varchar cast", () => {
  const repoPath = path.join(__dirname, "../src/services/buyer/checkout.repository.js");
  const source = fs.readFileSync(repoPath, "utf8");

  // Must contain the explicit varchar cast to avoid PostgreSQL 42P08 (ambiguous_parameter)
  assert.match(
    source,
    /CASE\s+WHEN\s+\$4::varchar\s*=\s*'SUCCEEDED'/i,
    "Expected explicit $4::varchar cast in payments insertion query"
  );

  // Must not have the uncast ambiguous parameter in CASE expression
  assert.doesNotMatch(
    source,
    /CASE\s+WHEN\s+\$4\s*=\s*'SUCCEEDED'/i,
    "Found uncast $4 = 'SUCCEEDED' which causes PostgreSQL 42P08"
  );
});

test("PostgreSQL regression: reproduces 42P08 on uncast parameter and passes on $4::varchar", async (t) => {
  let pool;
  try {
    pool = require("../src/config/db");
  } catch {
    t.skip("PostgreSQL config/db not available in this environment.");
    return;
  }

  let client;
  try {
    client = await pool.connect();
  } catch {
    t.skip("Live PostgreSQL database is not reachable; skipping parse check.");
    return;
  }

  try {
    // 1. Reproduce 42P08 with uncast query
    const uncastSql = `
      INSERT INTO payments (order_id, payment_method, amount, status, paid_at)
      VALUES (
        $1,
        $2,
        $3,
        $4,
        CASE WHEN $4 = 'SUCCEEDED' THEN CURRENT_TIMESTAMP ELSE NULL END
      )
      RETURNING payment_id, order_id, payment_method, amount, status, paid_at
    `;

    let uncastError = null;
    try {
      await client.query(`PREPARE test_42p08_uncast AS ${uncastSql}`);
    } catch (err) {
      uncastError = err;
    }

    assert.ok(uncastError, "Uncast query should have thrown an error");
    assert.equal(uncastError.code, "42P08", "Expected SQLSTATE 42P08");
    assert.match(
      uncastError.message,
      /inconsistent types deduced for parameter \$4/i,
      "Expected parameter $4 type deduction conflict"
    );

    // 2. Verify patched query with $4::varchar prepares cleanly
    const patchedSql = `
      INSERT INTO payments (order_id, payment_method, amount, status, paid_at)
      VALUES (
        $1,
        $2,
        $3,
        $4,
        CASE WHEN $4::varchar = 'SUCCEEDED' THEN CURRENT_TIMESTAMP ELSE NULL END
      )
      RETURNING payment_id, order_id, payment_method, amount, status, paid_at
    `;

    await client.query(`PREPARE test_42p08_patched AS ${patchedSql}`);
    await client.query("DEALLOCATE test_42p08_patched");
  } finally {
    try {
      await client.query("DEALLOCATE ALL");
    } catch {
      // ignore cleanup error
    }
    client.release();
  }
});

test("Mock execution: BANK_TRANSFER records PENDING payment and atomic transaction flow", async () => {
  const executedQueries = [];
  const fakeClient = {
    async query(sql, params) {
      executedQueries.push({ sql: sql.trim(), params });

      // 1. SELECT cart_id
      if (sql.includes("SELECT cart_id FROM carts")) {
        return { rowCount: 1, rows: [{ cart_id: "10" }] };
      }
      // 2. Existing order idempotency check
      if (sql.includes("FROM orders o") && sql.includes("checkout_key = $3")) {
        return { rowCount: 0, rows: [] };
      }
      // 3. Buyer company
      if (sql.includes("SELECT company_name, tax_id FROM companies")) {
        return { rowCount: 1, rows: [{ company_name: "Aero Logistics Ltd", tax_id: "TAX-1234" }] };
      }
      // 4. Shipping address
      if (sql.includes("SELECT address_id") && sql.includes("addresses")) {
        return {
          rowCount: 1,
          rows: [{
            address_id: "1",
            recipient_name: "John Doe",
            phone: "+1-555-0199",
            address_line: "Hangar 4B",
            city: "Seattle",
            region: "WA",
            postal_code: "98101",
            country_code: "US",
          }],
        };
      }
      // 5. Cart items + seller listings
      if (sql.includes("FROM cart_items ci")) {
        return {
          rowCount: 1,
          rows: [{
            cart_item_id: "101",
            quantity: 1,
            listing_id: "501",
            unit_price: "2500.00",
            stock_quantity: 5,
            seller_sku: "AP-009",
            condition: "FN",
            listing_status: "ACTIVE",
            supplier_id: "301",
            supplier_name: "Precision Aero",
            supplier_status: "APPROVED",
            product_name: "Access Panel 009",
            part_number: "PN-AP-009",
            is_active: true,
          }],
        };
      }
      // 6. INSERT INTO orders
      if (sql.includes("INSERT INTO orders")) {
        return {
          rowCount: 1,
          rows: [{
            order_id: "701",
            order_number: "ORD-TEST-001",
            checkout_key: params[3],
            grand_total: params[11],
            currency: "USD",
            created_at: new Date().toISOString(),
          }],
        };
      }
      // 7. INSERT INTO seller_orders
      if (sql.includes("INSERT INTO seller_orders")) {
        return { rowCount: 1, rows: [{ seller_order_id: "801" }] };
      }
      // 8. UPDATE seller_listings
      if (sql.includes("UPDATE seller_listings sl")) {
        return { rowCount: 1, rows: [{ listing_id: "501" }] };
      }
      // 9. INSERT INTO order_items
      if (sql.includes("INSERT INTO order_items")) {
        return { rowCount: 1, rows: [{ order_item_id: "901" }] };
      }
      // 10. INSERT INTO payments
      if (sql.includes("INSERT INTO payments")) {
        assert.equal(params[1], "BANK_TRANSFER");
        assert.equal(params[3], "PENDING");
        return {
          rowCount: 1,
          rows: [{
            payment_id: "991",
            order_id: "701",
            payment_method: "BANK_TRANSFER",
            amount: params[2],
            status: "PENDING",
            paid_at: null,
          }],
        };
      }
      // 11. DELETE FROM cart_items
      if (sql.includes("DELETE FROM cart_items")) {
        return { rowCount: 1, rows: [] };
      }
      // Transaction control
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rowCount: 0, rows: [] };
      }
      throw new Error(`Unexpected query in mock: ${sql}`);
    },
    release() {},
  };

  const pool = require("../src/config/db");
  const origConnect = pool.connect;
  pool.connect = async () => fakeClient;

  try {
    const repository = require("../src/services/buyer/checkout.repository");
    const result = await repository.placeOrderTransaction({
      userId: "1",
      companyId: "1",
      shippingAddressId: "1",
      billingAddressId: "1",
      deliveryMethodId: "STANDARD",
      purchaseReference: "PO-TEST-001",
      paymentMethod: "BANK_TRANSFER",
      checkoutKey: "test_checkout_key_001",
    });

    assert.equal(result.created, true);
    assert.equal(result.order.order_id, "701");
    assert.equal(result.order.payment_method, "BANK_TRANSFER");
    assert.equal(result.order.payment_status, "PENDING");
    assert.equal(result.order.paid_at, null);

    const querySqls = executedQueries.map((q) => q.sql);
    assert.ok(querySqls.includes("BEGIN"), "Transaction must start with BEGIN");
    assert.ok(querySqls.includes("COMMIT"), "Transaction must end with COMMIT");
    assert.ok(
      querySqls.some((s) => s.includes("INSERT INTO payments") && s.includes("$4::varchar")),
      "Payment query must contain $4::varchar"
    );
  } finally {
    pool.connect = origConnect;
  }
});

