"use strict";

const pool = require("../../config/db");

const MAX_PG_INT = 2147483647n;

function failure(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function formatPaymentResponse(payment, orderMeta, extra = {}) {
  return {
    payment_id: String(payment.payment_id),
    order_id: String(payment.order_id),
    order_number: orderMeta.order_number,
    transfer_reference: orderMeta.order_number,
    payment_method: payment.payment_method,
    amount: String(payment.amount),
    currency: orderMeta.currency,
    status: payment.status,
    paid_at: payment.paid_at,
    ...extra,
  };
}

async function lockPaymentByOrderId(client, orderId) {
  const result = await client.query(
    `
      SELECT p.payment_id, p.order_id, p.payment_method, p.amount, p.status, p.paid_at,
             o.order_number, o.currency, o.grand_total
      FROM public.payments p
      JOIN public.orders o ON o.order_id = p.order_id
      WHERE p.order_id = $1
      FOR UPDATE OF p
    `,
    [orderId]
  );
  return result.rows[0] || null;
}

async function confirmBankTransferPayment(orderId) {
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;

    const existing = await lockPaymentByOrderId(client, orderId);
    if (!existing) {
      throw failure(404, "PAYMENT_NOT_FOUND", "Payment record was not found for this order.");
    }
    if (existing.payment_method !== "BANK_TRANSFER") {
      throw failure(
        409,
        "INVALID_PAYMENT_METHOD",
        "Only BANK_TRANSFER payments can be manually confirmed."
      );
    }
    if (existing.status === "CANCELLED") {
      throw failure(
        409,
        "PAYMENT_ALREADY_CANCELLED",
        "A cancelled bank transfer payment cannot be confirmed."
      );
    }
    if (existing.status === "SUCCEEDED") {
      await client.query("COMMIT");
      transactionOpen = false;
      return formatPaymentResponse(existing, existing, {
        already_confirmed: true,
      });
    }
    if (existing.status !== "PENDING") {
      throw failure(
        409,
        "INVALID_PAYMENT_STATUS",
        "Only PENDING bank transfer payments can be confirmed."
      );
    }

    const updated = await client.query(
      `
        UPDATE public.payments
        SET status = 'SUCCEEDED',
            paid_at = CURRENT_TIMESTAMP
        WHERE payment_id = $1
          AND payment_method = 'BANK_TRANSFER'
          AND status = 'PENDING'
        RETURNING payment_id, order_id, payment_method, amount, status, paid_at
      `,
      [existing.payment_id]
    );
    if (updated.rowCount !== 1) {
      throw failure(409, "PAYMENT_STATE_CHANGED", "Payment status changed concurrently.");
    }

    await client.query("COMMIT");
    transactionOpen = false;
    return formatPaymentResponse(updated.rows[0], existing, {
      already_confirmed: false,
    });
  } catch (error) {
    if (transactionOpen) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }
}

async function cancelBankTransferPayment(orderId) {
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;

    const existing = await lockPaymentByOrderId(client, orderId);
    if (!existing) {
      throw failure(404, "PAYMENT_NOT_FOUND", "Payment record was not found for this order.");
    }
    if (existing.payment_method !== "BANK_TRANSFER") {
      throw failure(
        409,
        "INVALID_PAYMENT_METHOD",
        "Only BANK_TRANSFER payments can be cancelled."
      );
    }
    if (existing.status === "SUCCEEDED") {
      throw failure(
        409,
        "PAYMENT_ALREADY_SUCCEEDED",
        "A succeeded payment cannot be cancelled."
      );
    }
    if (existing.status === "CANCELLED") {
      await client.query("COMMIT");
      transactionOpen = false;
      return formatPaymentResponse(existing, existing, {
        already_cancelled: true,
        stock_restored: false,
      });
    }
    if (existing.status !== "PENDING") {
      throw failure(
        409,
        "INVALID_PAYMENT_STATUS",
        "Only PENDING bank transfer payments can be cancelled."
      );
    }

    const sellerOrdersResult = await client.query(
      `
        SELECT seller_order_id, status
        FROM public.seller_orders
        WHERE order_id = $1
        ORDER BY seller_order_id ASC
        FOR UPDATE
      `,
      [orderId]
    );
    if (sellerOrdersResult.rows.some((row) => row.status !== "CONFIRMED")) {
      throw failure(
        409,
        "ORDER_ALREADY_IN_FULFILLMENT",
        "Cannot cancel payment for an order that has progressed beyond CONFIRMED."
      );
    }

    const updated = await client.query(
      `
        UPDATE public.payments
        SET status = 'CANCELLED',
            paid_at = NULL
        WHERE payment_id = $1
          AND payment_method = 'BANK_TRANSFER'
          AND status = 'PENDING'
        RETURNING payment_id, order_id, payment_method, amount, status, paid_at
      `,
      [existing.payment_id]
    );
    if (updated.rowCount !== 1) {
      throw failure(409, "PAYMENT_STATE_CHANGED", "Payment status changed concurrently.");
    }

    const reservedItemsResult = await client.query(
      `
        SELECT oi.listing_id, SUM(oi.quantity)::BIGINT AS reserved_quantity
        FROM public.order_items oi
        JOIN public.seller_orders so ON so.seller_order_id = oi.seller_order_id
        WHERE so.order_id = $1
        GROUP BY oi.listing_id
        ORDER BY oi.listing_id ASC
      `,
      [orderId]
    );
    if (!reservedItemsResult.rowCount) {
      throw failure(409, "ORDER_ITEMS_MISSING", "No reserved order items found for this order.");
    }

    for (const item of reservedItemsResult.rows) {
      const quantityBigInt = BigInt(item.reserved_quantity);
      if (quantityBigInt <= 0n || quantityBigInt > MAX_PG_INT) {
        throw failure(409, "STOCK_RESTORE_OVERFLOW", "Reserved quantity exceeds valid stock bounds.");
      }
      const quantity = Number(quantityBigInt);
      const restoreResult = await client.query(
        `
          UPDATE public.seller_listings sl
          SET stock_quantity = sl.stock_quantity + $1::INT,
              updated_at = CURRENT_TIMESTAMP
          WHERE sl.listing_id = $2
            AND sl.stock_quantity <= 2147483647 - $1::INT
          RETURNING sl.listing_id
        `,
        [quantity, item.listing_id]
      );
      if (restoreResult.rowCount !== 1) {
        throw failure(
          409,
          "STOCK_RESTORE_FAILED",
          "Could not restore reserved stock for all order items."
        );
      }
    }

    await client.query("COMMIT");
    transactionOpen = false;
    return formatPaymentResponse(updated.rows[0], existing, {
      already_cancelled: false,
      stock_restored: true,
    });
  } catch (error) {
    if (transactionOpen) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  confirmBankTransferPayment,
  cancelBankTransferPayment,
};

