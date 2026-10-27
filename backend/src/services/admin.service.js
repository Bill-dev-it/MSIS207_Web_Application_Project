const pool = require("../config/db");
const { notFound, validation } = require("../utils/errors");
const { num, iso } = require("../utils/mapper");
const { toListingDto } = require("../utils/dto");

/* ------------------------------------------------------------- Dashboard */

async function getDashboardMetrics() {
  const [
    engineCount,
    listingStats,
    orderStats,
    supplierStats,
    urgencyCounts,
    recentAudits,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS total FROM engines`),
    pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active,
        COUNT(*) FILTER (WHERE status = 'DRAFT') AS pending
      FROM seller_listings
    `),
    pool.query(`
      SELECT 
        COUNT(*) AS total,
        COALESCE(SUM(grand_total), 0) AS total_revenue
      FROM orders
    `),
    pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending
      FROM suppliers
    `),
    pool.query(`
      WITH latest_pred AS (
        SELECT DISTINCT ON (su.engine_id) p.urgency
        FROM rul_predictions p
        JOIN sensor_uploads su ON su.upload_id = p.upload_id
        WHERE p.status = 'SUCCEEDED'
        ORDER BY su.engine_id, p.cycle_at_prediction DESC
      )
      SELECT 
        COALESCE(urgency, 'NORMAL') AS urgency,
        COUNT(*) AS count
      FROM latest_pred
      GROUP BY urgency
    `),
    pool.query(`
      SELECT al.*, u.full_name AS actor_name, u.role AS actor_role
      FROM audit_logs al
      LEFT JOIN users u ON u.user_id = al.actor_user_id
      ORDER BY al.created_at DESC
      LIMIT 10
    `),
  ]);

  const urgencyMap = { NORMAL: 0, MONITOR: 0, PREPARE: 0, PRIORITIZE: 0 };
  urgencyCounts.rows.forEach((r) => {
    urgencyMap[r.urgency] = Number(r.count);
  });

  return {
    engines: {
      total: Number(engineCount.rows[0].total),
    },
    listings: {
      total: Number(listingStats.rows[0].total),
      active: Number(listingStats.rows[0].active),
      pendingModeration: Number(listingStats.rows[0].pending),
    },
    orders: {
      total: Number(orderStats.rows[0].total),
      revenue: Number(orderStats.rows[0].total_revenue),
    },
    suppliers: {
      total: Number(supplierStats.rows[0].total),
      approved: Number(supplierStats.rows[0].approved),
      pendingApproval: Number(supplierStats.rows[0].pending),
    },
    rulUrgencyDistribution: urgencyMap,
    recentActivity: recentAudits.rows.map((r) => ({
      auditId: num(r.audit_id),
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      metadata: r.metadata,
      createdAt: iso(r.created_at),
      actor: r.actor_user_id ? { id: num(r.actor_user_id), name: r.actor_name, role: r.actor_role } : null,
    })),
  };
}

/* ------------------------------------------------------------- Moderation */

async function listModerationQueue({ status = "DRAFT", limit = 20, offset = 0 } = {}) {
  const params = [];
  let whereClause = "";
  if (status && status !== "ALL") {
    params.push(status);
    whereClause = `WHERE l.status = $${params.length}`;
  }

  const [countRes, listRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS total FROM seller_listings l ${whereClause}`, params),
    pool.query(
      `SELECT l.*, p.product_name, p.part_number, p.product_type, c.category_name,
              s.store_name, s.status AS supplier_status,
              md.decision AS last_decision, md.note AS decision_note, md.decided_at
       FROM seller_listings l
       JOIN products p ON p.product_id = l.product_id
       JOIN categories c ON c.category_id = p.category_id
       JOIN suppliers s ON s.supplier_id = l.supplier_id
       LEFT JOIN LATERAL (
         SELECT decision, note, decided_at
         FROM moderation_decisions
         WHERE listing_id = l.listing_id
         ORDER BY decided_at DESC
         LIMIT 1
       ) md ON true
       ${whereClause}
       ORDER BY l.updated_at DESC, l.listing_id DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
  ]);

  return {
    total: Number(countRes.rows[0].total),
    items: listRes.rows.map((r) => ({
      ...toListingDto(r),
      status: r.status,
      categoryName: r.category_name,
      supplierStatus: r.supplier_status,
      lastDecision: r.last_decision ? {
        decision: r.last_decision,
        note: r.decision_note,
        decidedAt: iso(r.decided_at),
      } : null,
    })),
  };
}

async function moderateListing(adminUser, listingId, decision, note = "") {
  if (!["APPROVED", "REJECTED"].includes(decision)) {
    throw validation("decision must be either APPROVED or REJECTED", { field: "decision" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT listing_id, status, supplier_id FROM seller_listings WHERE listing_id = $1 FOR UPDATE`,
      [listingId]
    );
    if (!rows.length) throw notFound("Listing not found");

    const newStatus = decision === "APPROVED" ? "ACTIVE" : "HIDDEN";

    await client.query(
      `UPDATE seller_listings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE listing_id = $2`,
      [newStatus, listingId]
    );

    const { rows: [dec] } = await client.query(
      `INSERT INTO moderation_decisions (listing_id, decision, note, decided_by)
       VALUES ($1, $2, $3, $4) RETURNING decision_id, decided_at`,
      [listingId, decision, note, adminUser.userId]
    );

    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'seller_listing', $3, $4)`,
      [
        adminUser.userId,
        `LISTING_${decision}`,
        String(listingId),
        JSON.stringify({ note, previousStatus: rows[0].status, newStatus }),
      ]
    );

    await client.query("COMMIT");
    return {
      listingId: num(listingId),
      status: newStatus,
      decision,
      note,
      decidedAt: iso(dec.decided_at),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/* ------------------------------------------------------------- RUL Status & Health */

async function getRulSystemStatus() {
  const [
    uploadCount,
    predStats,
    modelVersions,
    urgencyCounts,
    lastHealthCheck,
    recentPredictions,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS total FROM sensor_uploads`),
    pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'SUCCEEDED') AS succeeded,
        COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
        COUNT(*) FILTER (WHERE status = 'RUNNING') AS running
      FROM rul_predictions
    `),
    pool.query(`SELECT * FROM ml_model_versions WHERE is_active = TRUE ORDER BY model_version_id DESC`),
    pool.query(`
      SELECT urgency, COUNT(*) AS count
      FROM rul_predictions
      WHERE status = 'SUCCEEDED' AND urgency IS NOT NULL
      GROUP BY urgency
    `),
    pool.query(`
      SELECT * FROM service_health_checks
      WHERE service_name = 'rul-service'
      ORDER BY checked_at DESC
      LIMIT 1
    `),
    pool.query(`
      SELECT p.*, e.engine_code, e.serial_number, em.model_name, su.dataset_subset, su.row_count, c.company_name
      FROM rul_predictions p
      JOIN sensor_uploads su ON su.upload_id = p.upload_id
      JOIN engines e ON e.engine_id = su.engine_id
      JOIN aircraft a ON a.aircraft_id = e.aircraft_id
      JOIN companies c ON c.company_id = a.company_id
      JOIN engine_models em ON em.engine_model_id = e.engine_model_id
      ORDER BY p.prediction_date DESC
      LIMIT 10
    `),
  ]);

  const urgencyDist = { NORMAL: 0, MONITOR: 0, PREPARE: 0, PRIORITIZE: 0 };
  urgencyCounts.rows.forEach((r) => {
    urgencyDist[r.urgency] = Number(r.count);
  });

  return {
    uploadsCount: Number(uploadCount.rows[0].total),
    predictions: {
      total: Number(predStats.rows[0].total),
      succeeded: Number(predStats.rows[0].succeeded),
      failed: Number(predStats.rows[0].failed),
      running: Number(predStats.rows[0].running),
    },
    activeModelVersion: modelVersions.rows[0] ? {
      modelName: modelVersions.rows[0].model_name,
      version: modelVersions.rows[0].version,
      datasetSubset: modelVersions.rows[0].dataset_subset,
      windowSize: modelVersions.rows[0].window_size,
    } : null,
    urgencyDistribution: urgencyDist,
    lastHealthCheck: lastHealthCheck.rows[0] ? {
      status: lastHealthCheck.rows[0].status,
      latencyMs: num(lastHealthCheck.rows[0].latency_ms),
      detail: lastHealthCheck.rows[0].detail,
      checkedAt: iso(lastHealthCheck.rows[0].checked_at),
    } : null,
    recentPredictions: recentPredictions.rows.map((r) => ({
      predictionId: num(r.prediction_id),
      engineCode: r.engine_code,
      serialNumber: r.serial_number,
      modelName: r.model_name,
      companyName: r.company_name,
      predictedRul: num(r.predicted_rul),
      cycleAtPrediction: num(r.cycle_at_prediction),
      urgency: r.urgency,
      status: r.status,
      predictionDate: iso(r.prediction_date),
    })),
  };
}

async function checkRulHealth(adminUser) {
  const serviceUrl = process.env.RUL_SERVICE_URL;
  const start = Date.now();
  let status = "DOWN";
  let detail = "";
  let latencyMs = 0;

  if (serviceUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      latencyMs = Date.now() - start;
      if (res.ok) {
        status = "UP";
        detail = `HTTP ${res.status} OK`;
      } else {
        status = "DEGRADED";
        detail = `Service responded with HTTP ${res.status}`;
      }
    } catch (err) {
      latencyMs = Date.now() - start;
      status = "DOWN";
      detail = err.name === "AbortError" ? "Connection timed out (3000ms)" : `Unreachable: ${err.message}`;
    }
  } else {
    // If no RUL_SERVICE_URL configured, ping DB as baseline service check
    latencyMs = Date.now() - start;
    status = "DEGRADED";
    detail = "RUL_SERVICE_URL not configured. RUL models operating in offline demo mode.";
  }

  const { rows: [record] } = await pool.query(
    `INSERT INTO service_health_checks (service_name, status, latency_ms, detail, checked_by)
     VALUES ('rul-service', $1, $2, $3, $4)
     RETURNING check_id, checked_at`,
    [status, latencyMs, detail, adminUser ? adminUser.userId : null]
  );

  return {
    checkId: num(record.check_id),
    serviceName: "rul-service",
    status,
    latencyMs,
    detail,
    checkedAt: iso(record.checked_at),
  };
}

/* ------------------------------------------------------------- Recommendations (Admin All) */

async function listAllRecommendations({ limit = 30, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT rr.*, p.predicted_rul, p.urgency, p.cycle_at_prediction, p.prediction_date,
            e.engine_id, e.engine_code, e.serial_number, em.model_name,
            c.company_name AS airline_name,
            l.price, l.stock_quantity, l.condition, l.lead_time_days,
            pr.product_name, pr.part_number, s.store_name
     FROM replacement_recommendations rr
     JOIN rul_predictions p ON p.prediction_id = rr.prediction_id
     JOIN sensor_uploads su ON su.upload_id = p.upload_id
     JOIN engines e ON e.engine_id = su.engine_id
     JOIN aircraft a ON a.aircraft_id = e.aircraft_id
     JOIN companies c ON c.company_id = a.company_id
     JOIN engine_models em ON em.engine_model_id = e.engine_model_id
     JOIN seller_listings l ON l.listing_id = rr.listing_id
     JOIN products pr ON pr.product_id = l.product_id
     JOIN suppliers s ON s.supplier_id = l.supplier_id
     ORDER BY p.prediction_date DESC, rr.rank_position ASC
     LIMIT ${limit} OFFSET ${offset}`
  );

  return rows.map((r) => ({
    recommendationId: num(r.recommendation_id),
    predictionId: num(r.prediction_id),
    rank: num(r.rank_position),
    rankingScore: num(r.ranking_score),
    reason: r.reason,
    engine: {
      engineId: num(r.engine_id),
      engineCode: r.engine_code,
      serialNumber: r.serial_number,
      modelName: r.model_name,
      airlineName: r.airline_name,
      predictedRul: num(r.predicted_rul),
      urgency: r.urgency,
    },
    part: {
      listingId: num(r.listing_id),
      productName: r.product_name,
      partNumber: r.part_number,
      condition: r.condition,
      price: num(r.price),
      stockQuantity: num(r.stock_quantity),
      leadTimeDays: num(r.lead_time_days),
      supplierName: r.store_name,
    },
  }));
}

/* ------------------------------------------------------------- Users & Companies (Prevent Dead Links) */

async function listUsers({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.role, u.is_active, u.created_at,
            c.company_id, c.company_name, c.company_type
     FROM users u
     JOIN companies c ON c.company_id = u.company_id
     ORDER BY u.user_id ASC
     LIMIT ${limit} OFFSET ${offset}`
  );
  return rows.map((r) => ({
    userId: num(r.user_id),
    fullName: r.full_name,
    email: r.email,
    role: r.role,
    isActive: r.is_active,
    createdAt: iso(r.created_at),
    company: {
      companyId: num(r.company_id),
      companyName: r.company_name,
      companyType: r.company_type,
    },
  }));
}

async function listCompanies({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT c.*, 
            COUNT(DISTINCT u.user_id) AS user_count,
            COUNT(DISTINCT a.aircraft_id) AS aircraft_count
     FROM companies c
     LEFT JOIN users u ON u.company_id = c.company_id
     LEFT JOIN aircraft a ON a.company_id = c.company_id
     GROUP BY c.company_id
     ORDER BY c.company_id ASC
     LIMIT ${limit} OFFSET ${offset}`
  );
  return rows.map((r) => ({
    companyId: num(r.company_id),
    companyName: r.company_name,
    companyType: r.company_type,
    taxId: r.tax_id,
    countryCode: r.country_code,
    userCount: Number(r.user_count),
    aircraftCount: Number(r.aircraft_count),
    createdAt: iso(r.created_at),
  }));
}

async function listSuppliers({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT s.*, c.company_name, c.country_code,
            COUNT(l.listing_id) AS listing_count
     FROM suppliers s
     JOIN companies c ON c.company_id = s.company_id
     LEFT JOIN seller_listings l ON l.supplier_id = s.supplier_id
     GROUP BY s.supplier_id, c.company_name, c.country_code
     ORDER BY s.supplier_id ASC
     LIMIT ${limit} OFFSET ${offset}`
  );
  return rows.map((r) => ({
    supplierId: num(r.supplier_id),
    companyId: num(r.company_id),
    companyName: r.company_name,
    storeName: r.store_name,
    slug: r.slug,
    status: r.status,
    listingCount: Number(r.listing_count),
    createdAt: iso(r.created_at),
  }));
}

module.exports = {
  getDashboardMetrics,
  listModerationQueue,
  moderateListing,
  getRulSystemStatus,
  checkRulHealth,
  listAllRecommendations,
  listUsers,
  listCompanies,
  listSuppliers,
};
