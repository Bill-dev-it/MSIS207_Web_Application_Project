const crypto = require("crypto");
const pool = require("../config/db");
const { notFound, conflict, validation } = require("../utils/errors");
const { likePattern } = require("../utils/validate");
const { num, iso } = require("../utils/mapper");
const {
  toPredictionDto, toUploadDto, toEngineDto, toListingDto, toCartItemDto, toOrderSummaryDto,
  ORDER_STATUS_BY_RANK,
} = require("../utils/dto");

/* Flat per-seller-order shipping fee. No pricing rule exists in the repo (docs/OPEN_QUESTIONS.md Q8). */
const shippingFee = () => Number(process.env.SHIPPING_FEE_USD || 0);
const money = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ engines */

async function listEngines(companyId) {
  const { rows } = await pool.query(
    `SELECT e.engine_id, e.engine_code, e.serial_number, e.current_cycle, e.engine_model_id,
            em.manufacturer AS engine_manufacturer, em.model_name, em.engine_family, em.engine_type,
            a.aircraft_id, a.registration_number, a.manufacturer AS aircraft_manufacturer,
            a.model AS aircraft_model, a.status AS aircraft_status
       FROM engines e
       JOIN aircraft a ON a.aircraft_id = e.aircraft_id
       JOIN engine_models em ON em.engine_model_id = e.engine_model_id
      WHERE a.company_id = $1
      ORDER BY e.engine_id`,
    [companyId]
  );
  if (!rows.length) return [];
  const ids = rows.map((r) => r.engine_id);
  const [preds, ups] = await Promise.all([
    pool.query(
      `SELECT su.engine_id, p.*
         FROM rul_predictions p JOIN sensor_uploads su ON su.upload_id = p.upload_id
        WHERE su.engine_id = ANY($1::bigint[]) AND p.status = 'SUCCEEDED'
        ORDER BY su.engine_id, p.cycle_at_prediction, p.prediction_date`,
      [ids]
    ),
    pool.query(
      `SELECT * FROM sensor_uploads WHERE engine_id = ANY($1::bigint[]) ORDER BY engine_id, created_at DESC`,
      [ids]
    ),
  ]);
  const group = (list, map) =>
    list.reduce((acc, r) => ((acc[r.engine_id] ||= []).push(map(r)), acc), {});
  const pByEngine = group(preds.rows, toPredictionDto);
  const uByEngine = group(ups.rows, toUploadDto);
  return rows.map((r) => toEngineDto(r, pByEngine[r.engine_id] || [], uByEngine[r.engine_id] || []));
}

/* -------------------------------------------------------------------- cart */

const CART_SELECT = `
  SELECT ci.cart_item_id, ci.quantity, l.listing_id, l.seller_sku, l.condition, l.price,
         l.stock_quantity, l.lead_time_days, l.status AS listing_status,
         p.product_id, p.product_name, p.part_number, p.manufacturer AS product_manufacturer,
         s.supplier_id, s.store_name, s.status AS supplier_status
    FROM carts c
    JOIN cart_items ci ON ci.cart_id = c.cart_id
    JOIN seller_listings l ON l.listing_id = ci.listing_id
    JOIN products p ON p.product_id = l.product_id
    JOIN suppliers s ON s.supplier_id = l.supplier_id
   WHERE c.user_id = $1
   ORDER BY ci.cart_item_id`;

async function getCart(userId) {
  const { rows } = await pool.query(CART_SELECT, [userId]);
  const items = rows.map(toCartItemDto);
  return {
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: money(items.reduce((s, i) => s + i.lineTotal, 0)),
    hasUnavailable: items.some((i) => !i.available),
  };
}

async function addToCart(userId, listingId, quantity) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: ls } = await client.query(
      `SELECT l.stock_quantity, l.status, s.status AS supplier_status
         FROM seller_listings l JOIN suppliers s ON s.supplier_id = l.supplier_id
        WHERE l.listing_id = $1`,
      [listingId]
    );
    if (!ls.length) throw notFound("Listing not found");
    if (ls[0].status !== "ACTIVE" || ls[0].supplier_status !== "APPROVED") {
      throw conflict("LISTING_UNAVAILABLE", "This listing is not available for purchase");
    }
    await client.query(
      `INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [userId]);
    const { rows: [cart] } = await client.query(`SELECT cart_id FROM carts WHERE user_id=$1 FOR UPDATE`, [userId]);
    const { rows: existing } = await client.query(
      `SELECT quantity FROM cart_items WHERE cart_id=$1 AND listing_id=$2`, [cart.cart_id, listingId]);
    const wanted = (existing[0]?.quantity || 0) + quantity;
    if (wanted > ls[0].stock_quantity) {
      throw conflict("INSUFFICIENT_STOCK", `Only ${ls[0].stock_quantity} in stock`, {
        stockQuantity: ls[0].stock_quantity, inCart: existing[0]?.quantity || 0,
      });
    }
    await client.query(
      `INSERT INTO cart_items (cart_id, listing_id, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (cart_id, listing_id) DO UPDATE SET quantity = $3`,
      [cart.cart_id, listingId, wanted]
    );
    await client.query(`UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE cart_id=$1`, [cart.cart_id]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return getCart(userId);
}

async function removeCartItem(userId, cartItemId) {
  const { rowCount } = await pool.query(
    `DELETE FROM cart_items ci USING carts c
      WHERE ci.cart_id = c.cart_id AND c.user_id = $1 AND ci.cart_item_id = $2`,
    [userId, cartItemId]
  );
  if (!rowCount) throw notFound("Cart item not found");
  return getCart(userId);
}

/* ------------------------------------------------------------------ orders */

const RANK_SQL = `MIN(CASE so.status WHEN 'CONFIRMED' THEN 1 WHEN 'PROCESSING' THEN 2
                                     WHEN 'SHIPPED' THEN 3 WHEN 'DELIVERED' THEN 4 END)`;

async function listOrders(companyId, { search, status, limit, offset }) {
  const params = [companyId];
  const where = [`o.buyer_company_id = $1`];
  if (search) {
    params.push(likePattern(search));
    const p = `$${params.length}`;
    where.push(`(o.order_number ILIKE ${p} OR o.purchase_reference ILIKE ${p}
      OR EXISTS (SELECT 1 FROM seller_orders so2 LEFT JOIN order_items oi2 ON oi2.seller_order_id = so2.seller_order_id
                  WHERE so2.order_id = o.order_id AND (so2.supplier_name_snapshot ILIKE ${p}
                     OR oi2.product_name_snapshot ILIKE ${p} OR oi2.part_number_snapshot ILIKE ${p})))`);
  }
  const rankFilter = status
    ? (params.push(Object.keys(ORDER_STATUS_BY_RANK).find((k) => ORDER_STATUS_BY_RANK[k] === status)),
      `HAVING ${RANK_SQL} = $${params.length}::int`)
    : "";
  const base = `
    FROM orders o JOIN seller_orders so ON so.order_id = o.order_id
   WHERE ${where.join(" AND ")}
   GROUP BY o.order_id ${rankFilter}`;
  const [{ rows }, { rows: [{ total }] }] = await Promise.all([
    pool.query(
      `SELECT o.*, ${RANK_SQL} AS status_rank,
              (SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi JOIN seller_orders s2
                 ON s2.seller_order_id = oi.seller_order_id WHERE s2.order_id = o.order_id) AS item_count,
              array_agg(DISTINCT so.supplier_name_snapshot) AS supplier_names
       ${base} ORDER BY o.created_at DESC, o.order_id DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
    pool.query(`SELECT COUNT(*) AS total FROM (SELECT o.order_id ${base}) t`, params),
  ]);
  return { items: rows.map(toOrderSummaryDto), total: Number(total) };
}

/** Counts per derived status (for filter tabs). */
async function orderStatusCounts(companyId) {
  const { rows } = await pool.query(
    `SELECT r AS status_rank, COUNT(*) AS n FROM (
        SELECT o.order_id, ${RANK_SQL} AS r FROM orders o JOIN seller_orders so ON so.order_id=o.order_id
         WHERE o.buyer_company_id=$1 GROUP BY o.order_id) t GROUP BY r`,
    [companyId]
  );
  const out = { CONFIRMED: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0 };
  rows.forEach((r) => (out[ORDER_STATUS_BY_RANK[r.status_rank]] = Number(r.n)));
  return out;
}

async function getOrderDetail(companyId, idOrNumber) {
  const byId = /^\d+$/.test(idOrNumber);
  const { rows: [order] } = await pool.query(
    `SELECT o.* FROM orders o WHERE o.buyer_company_id = $1 AND ${byId ? "o.order_id = $2::bigint" : "o.order_number = $2"}`,
    [companyId, idOrNumber]
  );
  if (!order) throw notFound("Order not found"); // also hides other companies' orders
  const [so, items, pay] = await Promise.all([
    pool.query(
      `SELECT so.*, sh.shipment_id, sh.carrier, sh.tracking_number, sh.shipped_at,
              sh.estimated_delivery_at, sh.delivered_at,
              (SELECT a.city FROM suppliers s JOIN addresses a ON a.company_id = s.company_id
                WHERE s.supplier_id = so.supplier_id ORDER BY a.address_id LIMIT 1) AS origin_city,
              (SELECT a.country_code FROM suppliers s JOIN addresses a ON a.company_id = s.company_id
                WHERE s.supplier_id = so.supplier_id ORDER BY a.address_id LIMIT 1) AS origin_country
         FROM seller_orders so LEFT JOIN shipments sh ON sh.seller_order_id = so.seller_order_id
        WHERE so.order_id = $1 ORDER BY so.seller_order_id`,
      [order.order_id]
    ),
    pool.query(
      `SELECT oi.* FROM order_items oi JOIN seller_orders so ON so.seller_order_id = oi.seller_order_id
        WHERE so.order_id = $1 ORDER BY oi.order_item_id`,
      [order.order_id]
    ),
    pool.query(`SELECT * FROM payments WHERE order_id = $1`, [order.order_id]),
  ]);
  const ship = order.shipping_address_snapshot || {};
  return {
    orderId: num(order.order_id),
    orderNumber: order.order_number,
    purchaseReference: order.purchase_reference,
    companyName: order.company_name_snapshot,
    currency: order.currency,
    subtotal: num(order.subtotal),
    shippingTotal: num(order.shipping_total),
    grandTotal: num(order.grand_total),
    createdAt: iso(order.created_at),
    shippingAddress: {
      recipientName: ship.recipient_name, phone: ship.phone, addressLine: ship.address_line,
      city: ship.city, region: ship.region, postalCode: ship.postal_code, countryCode: ship.country_code,
    },
    payment: pay.rows[0]
      ? { paymentId: num(pay.rows[0].payment_id), method: pay.rows[0].payment_method,
          amount: num(pay.rows[0].amount), status: pay.rows[0].status, paidAt: iso(pay.rows[0].paid_at) }
      : null,
    sellerOrders: so.rows.map((r) => ({
      sellerOrderId: num(r.seller_order_id),
      supplierId: num(r.supplier_id),
      supplierName: r.supplier_name_snapshot,
      status: r.status,
      subtotal: num(r.subtotal), shippingFee: num(r.shipping_fee), grandTotal: num(r.grand_total),
      createdAt: iso(r.created_at), processingAt: iso(r.processing_at),
      route: { originCity: r.origin_city, originCountry: r.origin_country,
               destinationCity: ship.city, destinationCountry: ship.country_code },
      shipment: r.shipment_id
        ? { shipmentId: num(r.shipment_id), carrier: r.carrier, trackingNumber: r.tracking_number,
            shippedAt: iso(r.shipped_at), estimatedDeliveryAt: iso(r.estimated_delivery_at),
            deliveredAt: iso(r.delivered_at) }
        : null,
      items: items.rows.filter((i) => i.seller_order_id === r.seller_order_id).map((i) => ({
        orderItemId: num(i.order_item_id), listingId: num(i.listing_id),
        productName: i.product_name_snapshot, partNumber: i.part_number_snapshot,
        sellerSku: i.seller_sku_snapshot, condition: i.condition_snapshot,
        quantity: num(i.quantity), unitPrice: num(i.unit_price), lineTotal: num(i.line_total),
      })),
    })),
  };
}

async function createOrderFromCart(user, { checkoutKey, purchaseReference, addressId }) {
  const key = checkoutKey || crypto.randomUUID();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Idempotency: same user + checkoutKey returns the original order.
    const { rows: dup } = await client.query(
      `SELECT order_number FROM orders WHERE placed_by=$1 AND checkout_key=$2`, [user.userId, key]);
    if (dup.length) { await client.query("COMMIT"); return { orderNumber: dup[0].order_number, duplicate: true }; }

    const { rows: [cart] } = await client.query(`SELECT cart_id FROM carts WHERE user_id=$1 FOR UPDATE`, [user.userId]);
    const { rows: lines } = cart
      ? await client.query(
          `SELECT ci.cart_item_id, ci.quantity, l.listing_id, l.supplier_id, l.price, l.stock_quantity,
                  l.status, l.seller_sku, l.condition, p.product_name, p.part_number,
                  s.store_name, s.status AS supplier_status
             FROM cart_items ci
             JOIN seller_listings l ON l.listing_id = ci.listing_id
             JOIN products p ON p.product_id = l.product_id
             JOIN suppliers s ON s.supplier_id = l.supplier_id
            WHERE ci.cart_id = $1 ORDER BY l.listing_id FOR UPDATE OF l`,
          [cart.cart_id])
      : { rows: [] };
    if (!lines.length) throw conflict("CART_EMPTY", "Your cart is empty");
    const bad = lines.filter((l) => l.status !== "ACTIVE" || l.supplier_status !== "APPROVED" || l.stock_quantity < l.quantity);
    if (bad.length) {
      throw conflict("CART_UNAVAILABLE", "Some items are no longer available in the requested quantity",
        { listingIds: bad.map((b) => Number(b.listing_id)) });
    }

    const { rows: addr } = await client.query(
      `SELECT * FROM addresses WHERE company_id=$1 ${addressId ? "AND address_id=$2" : ""} ORDER BY address_id LIMIT 1`,
      addressId ? [user.companyId, addressId] : [user.companyId]);
    if (!addr.length) throw validation("No shipping address on file for this company", { field: "addressId" });
    const { rows: [company] } = await client.query(`SELECT company_name, tax_id FROM companies WHERE company_id=$1`, [user.companyId]);

    const groups = new Map();
    for (const l of lines) (groups.get(l.supplier_id) || groups.set(l.supplier_id, []).get(l.supplier_id)).push(l);
    const fee = shippingFee();
    const subtotal = money(lines.reduce((s, l) => s + Number(l.price) * l.quantity, 0));
    const shippingTotal = money(fee * groups.size);

    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const snapshot = JSON.stringify(addr[0]);
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (order_number, buyer_company_id, placed_by, checkout_key, purchase_reference,
          company_name_snapshot, tax_id_snapshot, shipping_address_snapshot, billing_address_snapshot,
          subtotal, shipping_total, grand_total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11) RETURNING order_id`,
      [orderNumber, user.companyId, user.userId, key, purchaseReference || null, company.company_name,
       company.tax_id, snapshot, subtotal, shippingTotal, money(subtotal + shippingTotal)]
    );
    await client.query(`INSERT INTO payments (order_id, amount) VALUES ($1,$2)`, [order.order_id, money(subtotal + shippingTotal)]);

    for (const [supplierId, group] of groups) {
      const sub = money(group.reduce((s, l) => s + Number(l.price) * l.quantity, 0));
      const { rows: [so] } = await client.query(
        `INSERT INTO seller_orders (order_id, supplier_id, supplier_name_snapshot, subtotal, shipping_fee, grand_total)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING seller_order_id`,
        [order.order_id, supplierId, group[0].store_name, sub, fee, money(sub + fee)]
      );
      for (const l of group) {
        await client.query(
          `INSERT INTO order_items (seller_order_id, listing_id, product_name_snapshot, part_number_snapshot,
              seller_sku_snapshot, condition_snapshot, quantity, unit_price, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [so.seller_order_id, l.listing_id, l.product_name, l.part_number, l.seller_sku, l.condition,
           l.quantity, l.price, money(Number(l.price) * l.quantity)]
        );
        await client.query(
          `UPDATE seller_listings SET stock_quantity = stock_quantity - $2, updated_at = CURRENT_TIMESTAMP WHERE listing_id=$1`,
          [l.listing_id, l.quantity]);
      }
    }
    await client.query(`DELETE FROM cart_items WHERE cart_id=$1`, [cart.cart_id]);
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1,'ORDER_CREATED','order',$2,$3)`,
      [user.userId, String(order.order_id), JSON.stringify({ orderNumber, grandTotal: money(subtotal + shippingTotal) })]);
    await client.query("COMMIT");
    return { orderNumber, orderId: Number(order.order_id), duplicate: false };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/* --------------------------------------------------------- recommendations */

async function listRecommendations(companyId, engineId) {
  const params = [companyId];
  if (engineId) params.push(engineId);
  const { rows } = await pool.query(
    `WITH latest AS (
        SELECT DISTINCT ON (su.engine_id) su.engine_id, p.prediction_id, p.predicted_rul, p.urgency,
               p.cycle_at_prediction, p.prediction_date, p.explanation
          FROM rul_predictions p JOIN sensor_uploads su ON su.upload_id = p.upload_id
         WHERE p.status='SUCCEEDED'
         ORDER BY su.engine_id, p.cycle_at_prediction DESC, p.prediction_date DESC)
     SELECT lt.*, e.engine_code, e.serial_number, em.model_name,
            rr.recommendation_id, rr.rank_position, rr.ranking_score, rr.reason,
            l.listing_id, l.seller_sku, l.condition, l.price, l.stock_quantity, l.lead_time_days,
            p.product_id, p.product_name, p.part_number, p.manufacturer AS product_manufacturer,
            s.supplier_id, s.store_name
       FROM latest lt
       JOIN engines e ON e.engine_id = lt.engine_id
       JOIN aircraft a ON a.aircraft_id = e.aircraft_id AND a.company_id = $1
       JOIN engine_models em ON em.engine_model_id = e.engine_model_id
       LEFT JOIN replacement_recommendations rr ON rr.prediction_id = lt.prediction_id
       LEFT JOIN seller_listings l ON l.listing_id = rr.listing_id
       LEFT JOIN products p ON p.product_id = l.product_id
       LEFT JOIN suppliers s ON s.supplier_id = l.supplier_id
      WHERE lt.urgency IN ('PREPARE','PRIORITIZE') ${engineId ? "AND e.engine_id = $2" : ""}
      ORDER BY CASE lt.urgency WHEN 'PRIORITIZE' THEN 0 ELSE 1 END, lt.engine_id, rr.rank_position`,
    params
  );
  const byEngine = new Map();
  for (const r of rows) {
    if (!byEngine.has(r.engine_id)) {
      byEngine.set(r.engine_id, {
        engineId: num(r.engine_id), engineCode: r.engine_code, serialNumber: r.serial_number,
        modelName: r.model_name, predictedRul: num(r.predicted_rul), urgency: r.urgency,
        cycleAtPrediction: num(r.cycle_at_prediction), predictionDate: iso(r.prediction_date),
        recommendations: [],
      });
    }
    if (r.recommendation_id) {
      byEngine.get(r.engine_id).recommendations.push({
        recommendationId: num(r.recommendation_id), rank: num(r.rank_position),
        rankingScore: num(r.ranking_score), reason: r.reason, ...toListingDto(r),
      });
    }
  }
  return [...byEngine.values()];
}

/* ----------------------------------------------------- inquiries & search */

async function createInquiry(user, { supplierId, sellerOrderId, subject, message }) {
  if (sellerOrderId) {
    const { rows } = await pool.query(
      `SELECT 1 FROM seller_orders so JOIN orders o ON o.order_id = so.order_id
        WHERE so.seller_order_id=$1 AND so.supplier_id=$2 AND o.buyer_company_id=$3`,
      [sellerOrderId, supplierId, user.companyId]);
    if (!rows.length) throw notFound("Order not found for this supplier");
  } else {
    const { rows } = await pool.query(`SELECT 1 FROM suppliers WHERE supplier_id=$1`, [supplierId]);
    if (!rows.length) throw notFound("Supplier not found");
  }
  const { rows: [r] } = await pool.query(
    `INSERT INTO supplier_inquiries (buyer_company_id, created_by, supplier_id, seller_order_id, subject, message)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING inquiry_id, created_at`,
    [user.companyId, user.userId, supplierId, sellerOrderId || null, subject, message]);
  await pool.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES ($1,'INQUIRY_CREATED','supplier_inquiry',$2)`,
    [user.userId, String(r.inquiry_id)]);
  return { inquiryId: num(r.inquiry_id), createdAt: iso(r.created_at) };
}

async function search(companyId, q) {
  const p = likePattern(q);
  const [engines, orders, parts] = await Promise.all([
    pool.query(
      `SELECT e.engine_id, e.engine_code, e.serial_number, em.model_name
         FROM engines e JOIN aircraft a ON a.aircraft_id=e.aircraft_id
         JOIN engine_models em ON em.engine_model_id=e.engine_model_id
        WHERE a.company_id=$1 AND (e.engine_code ILIKE $2 OR e.serial_number ILIKE $2 OR em.model_name ILIKE $2)
        ORDER BY e.engine_id LIMIT 5`, [companyId, p]),
    pool.query(
      `SELECT order_id, order_number, purchase_reference FROM orders
        WHERE buyer_company_id=$1 AND (order_number ILIKE $2 OR purchase_reference ILIKE $2)
        ORDER BY created_at DESC LIMIT 5`, [companyId, p]),
    pool.query(
      `SELECT pr.product_id, pr.product_name, pr.part_number, MIN(l.price) AS min_price
         FROM products pr JOIN seller_listings l ON l.product_id = pr.product_id AND l.status='ACTIVE'
        WHERE pr.is_active AND (pr.part_number ILIKE $1 OR pr.product_name ILIKE $1)
        GROUP BY pr.product_id ORDER BY pr.part_number LIMIT 5`, [p]),
  ]);
  return {
    engines: engines.rows.map((r) => ({ engineId: num(r.engine_id), engineCode: r.engine_code, serialNumber: r.serial_number, modelName: r.model_name })),
    orders: orders.rows.map((r) => ({ orderId: num(r.order_id), orderNumber: r.order_number, purchaseReference: r.purchase_reference })),
    parts: parts.rows.map((r) => ({ productId: num(r.product_id), productName: r.product_name, partNumber: r.part_number, minPrice: num(r.min_price) })),
  };
}

module.exports = {
  listEngines, getCart, addToCart, removeCartItem, listOrders, orderStatusCounts, getOrderDetail,
  createOrderFromCart, listRecommendations, createInquiry, search,
};
