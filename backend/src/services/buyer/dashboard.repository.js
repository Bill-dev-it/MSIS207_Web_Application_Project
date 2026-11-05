const pool = require("../../config/db");

async function getDashboardSummary({ companyId, userId }) {
  // 1. Total engines for this company
  const enginesRes = await pool.query(
    `SELECT COUNT(e.engine_id) AS total_engines
     FROM engines e
     JOIN aircraft a ON e.aircraft_id = a.aircraft_id
     WHERE a.company_id = $1`,
    [companyId]
  );
  const totalEngines = Number(enginesRes.rows[0]?.total_engines || 0);

  // 2. Active orders count (orders where seller_orders are not cancelled or delivered)
  const ordersRes = await pool.query(
    `SELECT COUNT(DISTINCT o.order_id) AS active_orders
     FROM orders o
     JOIN seller_orders so ON o.order_id = so.order_id
     WHERE o.buyer_company_id = $1
       AND so.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED')`,
    [companyId]
  );
  const activeOrders = Number(ordersRes.rows[0]?.active_orders || 0);

  // Wishlist items are user-owned in the current schema.
  const wishlistRes = await pool.query(
    "SELECT COUNT(*) AS total_wishlist FROM wishlist_items WHERE user_id = $1",
    [userId]
  );
  const totalWishlist = Number(wishlistRes.rows[0]?.total_wishlist || 0);

  // 4. Critical RUL alerts (engines with latest prediction having urgency = 'PRIORITIZE')
  const alertsRes = await pool.query(
    `WITH latest_preds AS (
       SELECT DISTINCT ON (su.engine_id)
         su.engine_id,
         rp.predicted_rul,
         rp.urgency,
         rp.prediction_date,
         e.engine_code,
         em.model_name
       FROM rul_predictions rp
       JOIN sensor_uploads su ON rp.upload_id = su.upload_id
       JOIN engines e ON su.engine_id = e.engine_id
       JOIN engine_models em ON e.engine_model_id = em.engine_model_id
       JOIN aircraft a ON e.aircraft_id = a.aircraft_id
       WHERE a.company_id = $1 AND rp.status = 'SUCCEEDED'
       ORDER BY su.engine_id, rp.prediction_date DESC
     )
     SELECT *
     FROM latest_preds
     WHERE urgency = 'PRIORITIZE'
     ORDER BY predicted_rul ASC`,
    [companyId]
  );

  const rulAlertsCount = alertsRes.rows.length;
  const criticalEngineAlert = alertsRes.rows[0] || null;

  // 5. Company info
  const companyRes = await pool.query(
    `SELECT company_id, company_name, company_type, country_code
     FROM companies
     WHERE company_id = $1`,
    [companyId]
  );
  const company = companyRes.rows[0] || null;

  return {
    company,
    stats: {
      totalEngines,
      activeOrders,
      rulAlerts: rulAlertsCount,
      wishlistCount: totalWishlist,
    },
    criticalAlert: criticalEngineAlert
      ? {
          engineId: criticalEngineAlert.engine_id,
          engineCode: criticalEngineAlert.engine_code,
          modelName: criticalEngineAlert.model_name,
          predictedRul: Number(criticalEngineAlert.predicted_rul),
          urgency: criticalEngineAlert.urgency,
          predictionDate: criticalEngineAlert.prediction_date,
        }
      : null,
  };
}

async function getDashboardEngineHealth({ companyId, limit = 5 }) {
  const query = `
    WITH latest_preds AS (
      SELECT DISTINCT ON (su.engine_id)
        su.engine_id,
        rp.predicted_rul,
        rp.urgency,
        rp.prediction_date
      FROM rul_predictions rp
      JOIN sensor_uploads su ON rp.upload_id = su.upload_id
      WHERE rp.status = 'SUCCEEDED'
      ORDER BY su.engine_id, rp.prediction_date DESC
    )
    SELECT
      e.engine_id,
      e.engine_code,
      e.serial_number,
      e.current_cycle,
      em.model_name,
      a.registration_number AS aircraft_tail,
      a.model AS aircraft_model,
      lp.predicted_rul,
      lp.urgency,
      lp.prediction_date AS last_analysis
    FROM engines e
    JOIN engine_models em ON e.engine_model_id = em.engine_model_id
    JOIN aircraft a ON e.aircraft_id = a.aircraft_id
    LEFT JOIN latest_preds lp ON e.engine_id = lp.engine_id
    WHERE a.company_id = $1
    ORDER BY
      CASE
        WHEN lp.urgency = 'PRIORITIZE' THEN 1
        WHEN lp.urgency = 'PREPARE' THEN 2
        WHEN lp.urgency = 'MONITOR' THEN 3
        WHEN lp.urgency = 'NORMAL' THEN 4
        ELSE 5
      END,
      e.current_cycle DESC
    LIMIT $2;
  `;

  const res = await pool.query(query, [companyId, limit]);
  return res.rows.map((row) => ({
    engineId: row.engine_id,
    engineCode: row.engine_code,
    serialNumber: row.serial_number,
    currentCycle: Number(row.current_cycle),
    modelName: row.model_name,
    aircraftTail: row.aircraft_tail,
    aircraftModel: row.aircraft_model,
    predictedRul: row.predicted_rul != null ? Number(row.predicted_rul) : null,
    urgency: row.urgency || "NOT_ANALYZED",
    lastAnalysis: row.last_analysis,
  }));
}

module.exports = {
  getDashboardSummary,
  getDashboardEngineHealth,
};
