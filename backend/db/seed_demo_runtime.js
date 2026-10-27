/**
 * DEMO runtime seed – NOT part of the Gold dataset.
 *
 * Creates demo users, ML model version, sensor uploads, RUL predictions,
 * recommendations and orders that reference REAL Gold IDs (engines, aircraft →
 * companies, seller_listings, suppliers). Idempotent: every row is looked up by a
 * natural key before insert, so it can be re-run safely.
 *
 * Everything created here is identifiable as demo:
 *   users.email      → *@demo.aerorul.test
 *   orders.order_number → DEMO-ORD-####
 *   sensor_uploads.is_demo = TRUE, object_key LIKE 'demo/%'
 *   rul_predictions.request_key LIKE 'DEMO-%'
 *
 * Usage:  node backend/db/seed_demo_runtime.js     (uses DB_* env vars)
 * Requires Gold data already loaded (database/seed/load_gold.py).
 *
 * NOTE (docs/OPEN_QUESTIONS.md Q1): the project has no documented RUL→urgency
 * thresholds. The cut-offs below exist ONLY to label demo rows and are stored in
 * decision_rule_snapshot as "DEMO_ONLY". The API never recomputes urgency.
 */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DEMO_PASSWORD = "Demo@12345";
const DEMO_DOMAIN = "demo.aerorul.test";

const BUYER_COMPANIES = [
  { id: 1, slug: "horizon" },
  { id: 2, slug: "pacific" },
  { id: 3, slug: "skyline" },
  { id: 4, slug: "meridian" },
  { id: 5, slug: "atlas" },
  { id: 6, slug: "coastal" },
];
const ADMIN_COMPANY_ID = 47; // "Demo Aviation Marketplace" (PLATFORM)

// DEMO-ONLY labelling of synthetic predictions (see header note)
const demoRul = (cycle) => Math.max(5, 150 - Math.round(cycle / 10));
const demoUrgency = (rul) =>
  rul <= 20 ? "PRIORITIZE" : rul <= 40 ? "PREPARE" : rul <= 90 ? "MONITOR" : "NORMAL";

const ORDER_SPECS = [
  { n: 1, company: 1, statuses: ["DELIVERED"], picks: [0, 5], daysAgo: 40 },
  { n: 2, company: 1, statuses: ["SHIPPED", "DELIVERED"], picks: [11, 23], daysAgo: 18 },
  { n: 3, company: 1, statuses: ["PROCESSING"], picks: [31], daysAgo: 6 },
  { n: 4, company: 1, statuses: ["CONFIRMED"], picks: [41, 47], daysAgo: 1 },
  { n: 5, company: 2, statuses: ["DELIVERED"], picks: [53], daysAgo: 30 },
  { n: 6, company: 2, statuses: ["SHIPPED"], picks: [59, 61], daysAgo: 9 },
  { n: 7, company: 3, statuses: ["CONFIRMED"], picks: [67], daysAgo: 2 },
  { n: 8, company: 4, statuses: ["PROCESSING"], picks: [71, 73], daysAgo: 5 },
  { n: 9, company: 5, statuses: ["DELIVERED"], picks: [79], daysAgo: 25 },
  { n: 10, company: 6, statuses: ["SHIPPED"], picks: [83], daysAgo: 8 },
];

const money = (n) => Math.round(n * 100) / 100;
const daysAgo = (d) => new Date(Date.now() - d * 86400000);
const addDays = (date, d) => new Date(date.getTime() + d * 86400000);

async function seedUsers(db) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [
    { email: `admin@${DEMO_DOMAIN}`, name: "Demo Platform Admin", role: "ADMIN", company: ADMIN_COMPANY_ID },
    ...BUYER_COMPANIES.map((c) => ({
      email: `buyer.${c.slug}@${DEMO_DOMAIN}`,
      name: `Demo Buyer (${c.slug})`,
      role: "BUYER",
      company: c.id,
    })),
  ];
  const ids = {};
  for (const u of users) {
    await db.query(
      `INSERT INTO users (company_id, full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING`,
      [u.company, u.name, u.email, hash, u.role]
    );
    const { rows } = await db.query(`SELECT user_id FROM users WHERE email=$1`, [u.email]);
    ids[u.email] = rows[0].user_id;
  }
  return {
    admin: ids[`admin@${DEMO_DOMAIN}`],
    byCompany: Object.fromEntries(BUYER_COMPANIES.map((c) => [c.id, ids[`buyer.${c.slug}@${DEMO_DOMAIN}`]])),
  };
}

async function seedRul(db, users) {
  await db.query(
    `INSERT INTO ml_model_versions
       (model_name, version, dataset_subset, model_object_key, scaler_object_key,
        preprocessing_version, window_size, sensor_schema)
     VALUES ('cmapss-rul-demo','demo-1','FD001','demo/models/cmapss-rul-demo-1.bin',
             'demo/models/cmapss-rul-demo-1.scaler','demo-pre-1',30,'{"features":14}')
     ON CONFLICT (model_name, version) DO NOTHING`
  );
  const { rows: mv } = await db.query(
    `SELECT model_version_id FROM ml_model_versions WHERE model_name='cmapss-rul-demo' AND version='demo-1'`
  );
  const modelVersionId = mv[0].model_version_id;

  const { rows: engines } = await db.query(
    `SELECT e.engine_id, e.engine_model_id, e.current_cycle, a.company_id
       FROM engines e JOIN aircraft a ON a.aircraft_id = e.aircraft_id ORDER BY e.engine_id`
  );

  for (const e of engines) {
    const cycles = [e.current_cycle - 60, e.current_cycle - 30, e.current_cycle].filter((c) => c >= 30);
    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];
      const key = `demo/sensor_uploads/engine-${e.engine_id}-cycle-${cycle}.csv`;
      const when = daysAgo((cycles.length - 1 - i) * 14 + 1 + (e.engine_id % 3));
      let up = (await db.query(`SELECT upload_id FROM sensor_uploads WHERE object_key=$1`, [key])).rows[0];
      if (!up) {
        up = (
          await db.query(
            `INSERT INTO sensor_uploads
               (engine_id, uploaded_by, original_file_name, object_key, file_sha256, dataset_subset,
                dataset_unit_id, first_cycle, last_cycle, row_count, is_demo, status, created_at)
             VALUES ($1,$2,$3,$4,$5,'FD001',$6,$7,$8,30,TRUE,'VALID',$9) RETURNING upload_id`,
            [
              e.engine_id,
              users.byCompany[e.company_id],
              `engine-${e.engine_id}-cycle-${cycle}.csv`,
              key,
              crypto.createHash("sha256").update(key).digest("hex"),
              `demo-${e.engine_id}`,
              cycle - 29,
              cycle,
              when,
            ]
          )
        ).rows[0];
      }
      const rul = demoRul(cycle);
      await db.query(
        `INSERT INTO rul_predictions
           (upload_id, model_version_id, requested_by, request_key, status, predicted_rul,
            cycle_at_prediction, urgency, decision_rule_snapshot, recommendation_status,
            explanation, prediction_date, completed_at)
         VALUES ($1,$2,$3,$4,'SUCCEEDED',$5,$6,$7,$8,'NOT_RUN',$9,$10,$10)
         ON CONFLICT (request_key) DO NOTHING`,
        [
          up.upload_id,
          modelVersionId,
          users.byCompany[e.company_id],
          `DEMO-RUL-e${e.engine_id}-c${cycle}`,
          rul,
          cycle,
          demoUrgency(rul),
          JSON.stringify({ source: "DEMO_ONLY", thresholds: "UNSPECIFIED", note: "Synthetic demo prediction" }),
          "Demo seed prediction – not produced by the RUL service.",
          when,
        ]
      );
    }
  }
}

/** Recommendations for the latest prediction of every engine at PREPARE / PRIORITIZE. */
async function seedRecommendations(db) {
  const { rows: latest } = await db.query(
    `SELECT DISTINCT ON (su.engine_id)
            p.prediction_id, su.engine_id, p.urgency, e.engine_model_id, em.model_name
       FROM rul_predictions p
       JOIN sensor_uploads su ON su.upload_id = p.upload_id
       JOIN engines e ON e.engine_id = su.engine_id
       JOIN engine_models em ON em.engine_model_id = e.engine_model_id
      WHERE p.request_key LIKE 'DEMO-%' AND p.status='SUCCEEDED'
      ORDER BY su.engine_id, p.cycle_at_prediction DESC`
  );
  for (const p of latest) {
    if (!["PREPARE", "PRIORITIZE"].includes(p.urgency)) continue;
    const { rows: listings } = await db.query(
      `SELECT l.listing_id, l.price, l.stock_quantity, l.lead_time_days, l.condition,
              pr.product_name, pr.part_number, s.store_name
         FROM seller_listings l
         JOIN products pr ON pr.product_id = l.product_id
         JOIN suppliers s ON s.supplier_id = l.supplier_id
         JOIN product_engine_compatibility c ON c.product_id = pr.product_id
        WHERE c.engine_model_id = $1 AND l.status='ACTIVE' AND l.stock_quantity > 0
          AND s.status='APPROVED' AND pr.is_active
        ORDER BY l.price ASC, l.listing_id ASC LIMIT 3`,
      [p.engine_model_id]
    );
    let rank = 0;
    for (const l of listings) {
      rank += 1;
      await db.query(
        `INSERT INTO replacement_recommendations
           (prediction_id, listing_id, rank_position, ranking_score, reason, listing_snapshot)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (prediction_id, listing_id) DO NOTHING`,
        [
          p.prediction_id,
          l.listing_id,
          rank,
          money(1 - (rank - 1) * 0.1),
          `Compatible with ${p.model_name}; ${l.stock_quantity} in stock; ${l.lead_time_days}-day lead time.`,
          JSON.stringify(l),
        ]
      );
    }
    await db.query(`UPDATE rul_predictions SET recommendation_status=$2 WHERE prediction_id=$1`, [
      p.prediction_id,
      listings.length ? "READY" : "NO_MATCH",
    ]);
  }
}

async function seedOrders(db, users) {
  const { rows: candidates } = await db.query(
    `SELECT l.listing_id, l.supplier_id, l.price, pr.product_name, pr.part_number, l.seller_sku,
            l.condition, s.store_name
       FROM seller_listings l
       JOIN products pr ON pr.product_id = l.product_id
       JOIN suppliers s ON s.supplier_id = l.supplier_id
      WHERE l.status='ACTIVE' AND l.stock_quantity >= 10 AND s.status='APPROVED'
      ORDER BY l.listing_id`
  );
  for (const spec of ORDER_SPECS) {
    const orderNumber = `DEMO-ORD-${String(spec.n).padStart(4, "0")}`;
    if ((await db.query(`SELECT 1 FROM orders WHERE order_number=$1`, [orderNumber])).rowCount) continue;

    const picked = spec.picks.map((i) => candidates[i % candidates.length]);
    const bySupplier = new Map();
    picked.forEach((l, idx) => {
      const qty = (idx % 3) + 1;
      if (!bySupplier.has(l.supplier_id)) bySupplier.set(l.supplier_id, []);
      if (!bySupplier.get(l.supplier_id).some((x) => x.l.listing_id === l.listing_id)) {
        bySupplier.get(l.supplier_id).push({ l, qty });
      }
    });

    const { rows: addr } = await db.query(
      `SELECT recipient_name, phone, address_line, city, region, postal_code, country_code
         FROM addresses WHERE company_id=$1 ORDER BY address_id LIMIT 1`,
      [spec.company]
    );
    const { rows: comp } = await db.query(`SELECT company_name, tax_id FROM companies WHERE company_id=$1`, [spec.company]);
    const created = daysAgo(spec.daysAgo);
    const SHIPPING_FEE = 85;

    let subtotal = 0;
    const sellerOrders = [...bySupplier.entries()].map(([supplierId, lines], i) => {
      const sub = money(lines.reduce((s, { l, qty }) => s + Number(l.price) * qty, 0));
      subtotal += sub;
      return { supplierId, lines, sub, status: spec.statuses[i % spec.statuses.length] };
    });
    subtotal = money(subtotal);
    const shippingTotal = SHIPPING_FEE * sellerOrders.length;

    const { rows: [order] } = await db.query(
      `INSERT INTO orders
         (order_number, buyer_company_id, placed_by, checkout_key, purchase_reference,
          company_name_snapshot, tax_id_snapshot, shipping_address_snapshot, billing_address_snapshot,
          subtotal, shipping_total, grand_total, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12) RETURNING order_id`,
      [
        orderNumber, spec.company, users.byCompany[spec.company], `demo-checkout-${spec.n}`,
        `DEMO-PO-${spec.n}`, comp[0].company_name, comp[0].tax_id, JSON.stringify(addr[0] || {}),
        subtotal, shippingTotal, money(subtotal + shippingTotal), created,
      ]
    );
    await db.query(
      `INSERT INTO payments (order_id, amount, paid_at) VALUES ($1,$2,$3)`,
      [order.order_id, money(subtotal + shippingTotal), created]
    );

    for (const so of sellerOrders) {
      const { rows: [sellerOrder] } = await db.query(
        `INSERT INTO seller_orders
           (order_id, supplier_id, supplier_name_snapshot, status, subtotal, shipping_fee, grand_total,
            processing_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING seller_order_id`,
        [
          order.order_id, so.supplierId, so.lines[0].l.store_name, so.status, so.sub, SHIPPING_FEE,
          money(so.sub + SHIPPING_FEE),
          so.status === "CONFIRMED" ? null : addDays(created, 1), created,
        ]
      );
      for (const { l, qty } of so.lines) {
        await db.query(
          `INSERT INTO order_items
             (seller_order_id, listing_id, product_name_snapshot, part_number_snapshot,
              seller_sku_snapshot, condition_snapshot, quantity, unit_price, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            sellerOrder.seller_order_id, l.listing_id, l.product_name, l.part_number, l.seller_sku,
            l.condition, qty, l.price, money(Number(l.price) * qty),
          ]
        );
      }
      if (so.status === "SHIPPED" || so.status === "DELIVERED") {
        const shipped = addDays(created, 2);
        await db.query(
          `INSERT INTO shipments
             (seller_order_id, carrier, tracking_number, shipped_at, estimated_delivery_at, delivered_at)
           VALUES ($1,'DEMO-CARRIER',$2,$3,$4,$5)`,
          [
            sellerOrder.seller_order_id, `DEMO-TRK-${spec.n}-${so.supplierId}`, shipped,
            addDays(created, 7), so.status === "DELIVERED" ? addDays(created, 6) : null,
          ]
        );
      }
    }
  }
}

async function seedDemoRuntime(db) {
  await db.query("BEGIN");
  try {
    const users = await seedUsers(db);
    await seedRul(db, users);
    await seedRecommendations(db);
    await seedOrders(db, users);
    await db.query("COMMIT");
    return { users };
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}

module.exports = { seedDemoRuntime, DEMO_PASSWORD, DEMO_DOMAIN, demoRul, demoUrgency };

if (require.main === module) {
  const { Client } = require("pg");
  require("dotenv").config();
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  client
    .connect()
    .then(() => seedDemoRuntime(client))
    .then(() => console.log(`Demo runtime seed OK. Login: admin@${DEMO_DOMAIN} / ${DEMO_PASSWORD}`))
    .catch((e) => {
      console.error("Demo seed failed:", e.message);
      process.exitCode = 1;
    })
    .finally(() => client.end());
}
