"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

function createMockClient(handlers) {
  const executed = [];
  return {
    executed,
    async query(sql, params) {
      executed.push({ sql: sql.trim(), params });
      for (const handler of handlers) {
        const result = handler(sql, params);
        if (result !== undefined) {
          if (result instanceof Error) throw result;
          return result;
        }
      }
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rowCount: 0, rows: [] };
      }
      throw new Error(`Unhandled query in mock: ${sql}`);
    },
    release() {},
  };
}

test("Admin Confirm: successfully confirms PENDING bank transfer to SUCCEEDED", async () => {
  const pool = require("../src/config/db");
  const origConnect = pool.connect;

  const mockClient = createMockClient([
    (sql, params) => {
      if (sql.includes("FROM public.payments p") && sql.includes("FOR UPDATE OF p")) {
        assert.equal(params[0], "101");
        return {
          rowCount: 1,
          rows: [{
            payment_id: "501",
            order_id: "101",
            payment_method: "BANK_TRANSFER",
            amount: "1500.00",
            status: "PENDING",
            paid_at: null,
            order_number: "ORD-101",
            currency: "USD",
            grand_total: "1500.00",
          }],
        };
      }
    },
    (sql, params) => {
      if (sql.includes("UPDATE public.payments") && sql.includes("SET status = 'SUCCEEDED'")) {
        assert.equal(params[0], "501");
        return {
          rowCount: 1,
          rows: [{
            payment_id: "501",
            order_id: "101",
            payment_method: "BANK_TRANSFER",
            amount: "1500.00",
            status: "SUCCEEDED",
            paid_at: new Date().toISOString(),
          }],
        };
      }
    },
  ]);

  pool.connect = async () => mockClient;

  try {
    const repo = require("../src/services/admin/payments.repository");
    const result = await repo.confirmBankTransferPayment("101");

    assert.equal(result.payment_id, "501");
    assert.equal(result.status, "SUCCEEDED");
    assert.equal(result.already_confirmed, false);
    assert.ok(result.paid_at, "paid_at should be populated on confirmation");

    const sqls = mockClient.executed.map((e) => e.sql);
    assert.ok(sqls.includes("BEGIN"));
    assert.ok(sqls.includes("COMMIT"));
  } finally {
    pool.connect = origConnect;
  }
});

test("Admin Confirm: idempotent when payment is already SUCCEEDED", async () => {
  const pool = require("../src/config/db");
  const origConnect = pool.connect;

  const paidAt = "2026-11-08T10:00:00.000Z";
  const mockClient = createMockClient([
    (sql, params) => {
      if (sql.includes("FROM public.payments p")) {
        return {
          rowCount: 1,
          rows: [{
            payment_id: "502",
            order_id: "102",
            payment_method: "BANK_TRANSFER",
            amount: "2000.00",
            status: "SUCCEEDED",
            paid_at: paidAt,
            order_number: "ORD-102",
            currency: "USD",
            grand_total: "2000.00",
          }],
        };
      }
    },
  ]);

  pool.connect = async () => mockClient;

  try {
    const repo = require("../src/services/admin/payments.repository");
    const result = await repo.confirmBankTransferPayment("102");

    assert.equal(result.status, "SUCCEEDED");
    assert.equal(result.already_confirmed, true);
    assert.equal(result.paid_at, paidAt);
  } finally {
    pool.connect = origConnect;
  }
});

test("Admin Confirm: rejects non-BANK_TRANSFER or already CANCELLED payment", async () => {
  const pool = require("../src/config/db");
  const origConnect = pool.connect;

  // Case 1: SIMULATION payment cannot be manually confirmed
  let currentPayment = {
    payment_id: "503",
    order_id: "103",
    payment_method: "SIMULATION",
    amount: "100.00",
    status: "SUCCEEDED",
    paid_at: "2026-11-08T10:00:00.000Z",
    order_number: "ORD-103",
    currency: "USD",
  };

  const mockClient = createMockClient([
    (sql) => {
      if (sql.includes("FROM public.payments p")) {
        return { rowCount: 1, rows: [currentPayment] };
      }
    },
  ]);

  pool.connect = async () => mockClient;

  try {
    const repo = require("../src/services/admin/payments.repository");
    await assert.rejects(
      async () => {
        await repo.confirmBankTransferPayment("103");
      },
      { code: "INVALID_PAYMENT_METHOD", statusCode: 409 }
    );

    // Case 2: CANCELLED bank transfer cannot be confirmed
    currentPayment = {
      payment_id: "504",
      order_id: "104",
      payment_method: "BANK_TRANSFER",
      amount: "100.00",
      status: "CANCELLED",
      paid_at: null,
      order_number: "ORD-104",
      currency: "USD",
    };

    await assert.rejects(
      async () => {
        await repo.confirmBankTransferPayment("104");
      },
      { code: "PAYMENT_ALREADY_CANCELLED", statusCode: 409 }
    );
  } finally {
    pool.connect = origConnect;
  }
});

test("Admin Cancel: cancels PENDING bank transfer and restores stock", async () => {
  const pool = require("../src/config/db");
  const origConnect = pool.connect;

  let stockRestored = false;

  const mockClient = createMockClient([
    (sql) => {
      if (sql.includes("FROM public.payments p")) {
        return {
          rowCount: 1,
          rows: [{
            payment_id: "601",
            order_id: "201",
            payment_method: "BANK_TRANSFER",
            amount: "3200.00",
            status: "PENDING",
            paid_at: null,
            order_number: "ORD-201",
            currency: "USD",
            grand_total: "3200.00",
          }],
        };
      }
    },
    (sql) => {
      if (sql.includes("FROM public.seller_orders") && sql.includes("FOR UPDATE")) {
        return {
          rowCount: 1,
          rows: [{ seller_order_id: "301", status: "CONFIRMED" }],
        };
      }
    },
    (sql) => {
      if (sql.includes("UPDATE public.payments") && sql.includes("SET status = 'CANCELLED'")) {
        return {
          rowCount: 1,
          rows: [{
            payment_id: "601",
            order_id: "201",
            payment_method: "BANK_TRANSFER",
            amount: "3200.00",
            status: "CANCELLED",
            paid_at: null,
          }],
        };
      }
    },
    (sql) => {
      if (sql.includes("SELECT oi.listing_id, SUM(oi.quantity)")) {
        return {
          rowCount: 1,
          rows: [{ listing_id: "801", reserved_quantity: "2" }],
        };
      }
    },
    (sql, params) => {
      if (sql.includes("UPDATE public.seller_listings") && sql.includes("stock_quantity + $1")) {
        assert.equal(params[0], 2);
        assert.equal(params[1], "801");
        stockRestored = true;
        return { rowCount: 1, rows: [{ listing_id: "801" }] };
      }
    },
  ]);

  pool.connect = async () => mockClient;

  try {
    const repo = require("../src/services/admin/payments.repository");
    const result = await repo.cancelBankTransferPayment("201");

    assert.equal(result.status, "CANCELLED");
    assert.equal(result.paid_at, null);
    assert.equal(result.already_cancelled, false);
    assert.equal(result.stock_restored, true);
    assert.equal(stockRestored, true, "Must restore inventory on cancellation");
  } finally {
    pool.connect = origConnect;
  }
});

test("Admin Cancel: idempotent when already CANCELLED, rejects already SUCCEEDED", async () => {
  const pool = require("../src/config/db");
  const origConnect = pool.connect;

  let currentPayment = {
    payment_id: "602",
    order_id: "202",
    payment_method: "BANK_TRANSFER",
    amount: "500.00",
    status: "CANCELLED",
    paid_at: null,
    order_number: "ORD-202",
    currency: "USD",
  };

  const mockClient = createMockClient([
    (sql) => {
      if (sql.includes("FROM public.payments p")) {
        return { rowCount: 1, rows: [currentPayment] };
      }
    },
  ]);

  pool.connect = async () => mockClient;

  try {
    const repo = require("../src/services/admin/payments.repository");

    // Case 1: Already CANCELLED returns idempotently
    const idempotentResult = await repo.cancelBankTransferPayment("202");
    assert.equal(idempotentResult.already_cancelled, true);
    assert.equal(idempotentResult.status, "CANCELLED");

    // Case 2: SUCCEEDED cannot be cancelled
    currentPayment = {
      payment_id: "603",
      order_id: "203",
      payment_method: "BANK_TRANSFER",
      amount: "500.00",
      status: "SUCCEEDED",
      paid_at: "2026-11-08T10:00:00.000Z",
      order_number: "ORD-203",
      currency: "USD",
    };

    await assert.rejects(
      async () => {
        await repo.cancelBankTransferPayment("203");
      },
      { code: "PAYMENT_ALREADY_SUCCEEDED", statusCode: 409 }
    );
  } finally {
    pool.connect = origConnect;
  }
});

test("Database Schema: B2B Payment MVP constraint matrix enforcement", async (t) => {
  let pool;
  try {
    pool = require("../src/config/db");
  } catch {
    t.skip("DB config unavailable; skipping live constraint validation.");
    return;
  }

  let client;
  try {
    client = await pool.connect();
  } catch {
    t.skip("Live PostgreSQL unavailable; skipping live constraint validation.");
    return;
  }

  try {
    // Test migration logic and check constraint in isolated temporary table
    await client.query(`
      CREATE TEMPORARY TABLE test_schema_payments (
        payment_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        order_id BIGINT NOT NULL,
        payment_method VARCHAR(30) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        paid_at TIMESTAMP,
        CONSTRAINT chk_test_payments_amount CHECK (amount >= 0),
        CONSTRAINT chk_test_payments_b2b_mvp_method_status CHECK (
          (
            payment_method = 'SIMULATION'
            AND status = 'SUCCEEDED'
            AND paid_at IS NOT NULL
          )
          OR
          (
            payment_method = 'BANK_TRANSFER'
            AND (
              (status = 'PENDING' AND paid_at IS NULL)
              OR (status = 'SUCCEEDED' AND paid_at IS NOT NULL)
              OR (status = 'CANCELLED' AND paid_at IS NULL)
            )
          )
        )
      );
    `);

    // 1. Valid: SIMULATION + SUCCEEDED + paid_at NOT NULL
    await client.query(`
      INSERT INTO test_schema_payments (order_id, payment_method, amount, status, paid_at)
      VALUES (1, 'SIMULATION', 100.00, 'SUCCEEDED', CURRENT_TIMESTAMP);
    `);

    // 2. Valid: BANK_TRANSFER + PENDING + paid_at NULL
    await client.query(`
      INSERT INTO test_schema_payments (order_id, payment_method, amount, status, paid_at)
      VALUES (2, 'BANK_TRANSFER', 200.00, 'PENDING', NULL);
    `);

    // 3. Valid: BANK_TRANSFER + SUCCEEDED + paid_at NOT NULL
    await client.query(`
      INSERT INTO test_schema_payments (order_id, payment_method, amount, status, paid_at)
      VALUES (3, 'BANK_TRANSFER', 300.00, 'SUCCEEDED', CURRENT_TIMESTAMP);
    `);

    // 4. Valid: BANK_TRANSFER + CANCELLED + paid_at NULL
    await client.query(`
      INSERT INTO test_schema_payments (order_id, payment_method, amount, status, paid_at)
      VALUES (4, 'BANK_TRANSFER', 400.00, 'CANCELLED', NULL);
    `);

    // 5. Invalid: BANK_TRANSFER + PENDING with timestamp -> must fail (23514)
    await assert.rejects(
      async () => {
        await client.query(`
          INSERT INTO test_schema_payments (order_id, payment_method, amount, status, paid_at)
          VALUES (5, 'BANK_TRANSFER', 100.00, 'PENDING', CURRENT_TIMESTAMP);
        `);
      },
      (err) => err.code === "23514"
    );

    // 6. Invalid: BANK_TRANSFER + SUCCEEDED with NULL timestamp -> must fail (23514)
    await assert.rejects(
      async () => {
        await client.query(`
          INSERT INTO test_schema_payments (order_id, payment_method, amount, status, paid_at)
          VALUES (6, 'BANK_TRANSFER', 100.00, 'SUCCEEDED', NULL);
        `);
      },
      (err) => err.code === "23514"
    );

    // 7. Invalid: SIMULATION + PENDING -> must fail (23514)
    await assert.rejects(
      async () => {
        await client.query(`
          INSERT INTO test_schema_payments (order_id, payment_method, amount, status, paid_at)
          VALUES (7, 'SIMULATION', 100.00, 'PENDING', NULL);
        `);
      },
      (err) => err.code === "23514"
    );
  } finally {
    try {
      await client.query("DROP TABLE IF EXISTS test_schema_payments;");
    } catch {
      // ignore cleanup error
    }
    client.release();
  }
});
