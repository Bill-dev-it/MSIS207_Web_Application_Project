"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const pool = require("../src/config/db");
const repo = require("../src/services/admin/payments.repository");

const originalConnect = pool.connect;

function useFakeTransaction(responder) {
  const executed = [];
  pool.connect = async () => ({
    async query(sql, params) {
      executed.push({ sql: sql.trim(), params });
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rowCount: 0, rows: [] };
      }
      return responder(sql, params);
    },
    release() {},
  });
  return executed;
}

test.after(() => {
  pool.connect = originalConnect;
});

test("confirmBankTransferPayment transitions PENDING transfer to SUCCEEDED and commits transaction", async () => {
  const executed = useFakeTransaction((sql) => {
    if (sql.includes("FROM public.payments p")) {
      return { rowCount: 1, rows: [{ payment_id: "501", order_id: "101", payment_method: "BANK_TRANSFER", amount: "1500.00", status: "PENDING", paid_at: null }] };
    }
    if (sql.includes("UPDATE public.payments") && sql.includes("SET status = 'SUCCEEDED'")) {
      return { rowCount: 1, rows: [{ payment_id: "501", order_id: "101", payment_method: "BANK_TRANSFER", amount: "1500.00", status: "SUCCEEDED", paid_at: "2026-11-08T10:00:00Z" }] };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });

  const result = await repo.confirmBankTransferPayment("101");
  assert.equal(result.status, "SUCCEEDED");
  assert.equal(result.already_confirmed, false);
  assert.equal(executed[0].sql, "BEGIN");
  assert.equal(executed.at(-1).sql, "COMMIT");
});

test("confirmBankTransferPayment is idempotent on SUCCEEDED and rejects SIMULATION or CANCELLED", async () => {
  useFakeTransaction(() => ({
    rowCount: 1,
    rows: [{ payment_id: "502", order_id: "102", payment_method: "BANK_TRANSFER", status: "SUCCEEDED", paid_at: "2026-11-08T10:00:00Z" }],
  }));
  const replay = await repo.confirmBankTransferPayment("102");
  assert.equal(replay.already_confirmed, true);

  useFakeTransaction(() => ({
    rowCount: 1,
    rows: [{ payment_id: "503", order_id: "103", payment_method: "SIMULATION", status: "SUCCEEDED" }],
  }));
  await assert.rejects(() => repo.confirmBankTransferPayment("103"), { code: "INVALID_PAYMENT_METHOD", statusCode: 409 });

  useFakeTransaction(() => ({
    rowCount: 1,
    rows: [{ payment_id: "504", order_id: "104", payment_method: "BANK_TRANSFER", status: "CANCELLED" }],
  }));
  await assert.rejects(() => repo.confirmBankTransferPayment("104"), { code: "PAYMENT_ALREADY_CANCELLED", statusCode: 409 });
});

test("cancelBankTransferPayment cancels PENDING transfer, restores reserved stock, and rolls back errors", async () => {
  let restoredParams = null;
  const executed = useFakeTransaction((sql, params) => {
    if (sql.includes("FROM public.payments p")) {
      return { rowCount: 1, rows: [{ payment_id: "601", order_id: "201", payment_method: "BANK_TRANSFER", status: "PENDING", paid_at: null }] };
    }
    if (sql.includes("FROM public.seller_orders")) {
      return { rowCount: 1, rows: [{ seller_order_id: "301", status: "CONFIRMED" }] };
    }
    if (sql.includes("UPDATE public.payments") && sql.includes("SET status = 'CANCELLED'")) {
      return { rowCount: 1, rows: [{ payment_id: "601", order_id: "201", payment_method: "BANK_TRANSFER", status: "CANCELLED", paid_at: null }] };
    }
    if (sql.includes("SELECT oi.listing_id, SUM(oi.quantity)")) {
      return { rowCount: 1, rows: [{ listing_id: "801", reserved_quantity: "2" }] };
    }
    if (sql.includes("UPDATE public.seller_listings") && sql.includes("stock_quantity + $1")) {
      restoredParams = params;
      return { rowCount: 1, rows: [{ listing_id: "801" }] };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });

  const cancelled = await repo.cancelBankTransferPayment("201");
  assert.equal(cancelled.status, "CANCELLED");
  assert.equal(cancelled.stock_restored, true);
  assert.deepEqual(restoredParams, [2, "801"]);
  assert.equal(executed.at(-1).sql, "COMMIT");

  // Rejecting SUCCEEDED payment cancellation must trigger ROLLBACK
  const rollbackTrace = useFakeTransaction(() => ({
    rowCount: 1,
    rows: [{ payment_id: "602", order_id: "202", payment_method: "BANK_TRANSFER", status: "SUCCEEDED" }],
  }));
  await assert.rejects(() => repo.cancelBankTransferPayment("202"), { code: "PAYMENT_ALREADY_SUCCEEDED", statusCode: 409 });
  assert.equal(rollbackTrace.at(-1).sql, "ROLLBACK");
});
