const pool = require("../../config/db");

async function getEngines({
  companyId,
  search = "",
  urgency = "ALL",
  page = 1,
  limit = 10,
}) {
  const offset = (page - 1) * limit;
  const conditions = ["a.company_id = $1"];
  const params = [companyId];
  let paramIdx = 2;

  if (search && search.trim()) {
    conditions.push(
      `(e.engine_code ILIKE $${paramIdx} OR em.model_name ILIKE $${paramIdx} OR a.registration_number ILIKE $${paramIdx} OR e.serial_number ILIKE $${paramIdx})`
    );
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  // Count by urgency for this company
  const urgencyCountsRes = await pool.query(
    `WITH latest_preds AS (
       SELECT DISTINCT ON (su.engine_id)
         su.engine_id,
         rp.predicted_rul,
         rp.urgency
       FROM rul_predictions rp
       JOIN sensor_uploads su ON rp.upload_id = su.upload_id
       WHERE rp.status = 'SUCCEEDED'
       ORDER BY su.engine_id, rp.prediction_date DESC
     )
     SELECT
       COUNT(e.engine_id) AS total_all,
       COUNT(CASE WHEN lp.urgency = 'PRIORITIZE' THEN 1 END) AS total_prioritize,
       COUNT(CASE WHEN lp.urgency = 'PREPARE' THEN 1 END) AS total_prepare,
       COUNT(CASE WHEN lp.urgency = 'MONITOR' THEN 1 END) AS total_monitor,
       COUNT(CASE WHEN lp.urgency = 'NORMAL' THEN 1 END) AS total_normal,
       COUNT(CASE WHEN lp.urgency IS NULL THEN 1 END) AS total_not_analyzed,
       COUNT(DISTINCT a.aircraft_id) AS total_aircraft
     FROM engines e
     JOIN aircraft a ON e.aircraft_id = a.aircraft_id
     LEFT JOIN latest_preds lp ON e.engine_id = lp.engine_id
     WHERE a.company_id = $1`,
    [companyId]
  );

  const rawCounts = urgencyCountsRes.rows[0] || {};
  const counts = {
    ALL: Number(rawCounts.total_all) || 0,
    PRIORITIZE: Number(rawCounts.total_prioritize) || 0,
    PREPARE: Number(rawCounts.total_prepare) || 0,
    MONITOR: Number(rawCounts.total_monitor) || 0,
    NORMAL: Number(rawCounts.total_normal) || 0,
    NOT_ANALYZED: Number(rawCounts.total_not_analyzed) || 0,
    aircraftCount: Number(rawCounts.total_aircraft) || 0,
  };

  // Urgency filter
  if (urgency && urgency !== "ALL") {
    if (urgency === "NOT_ANALYZED") {
      conditions.push("lp.urgency IS NULL");
    } else {
      conditions.push(`lp.urgency = $${paramIdx}`);
      params.push(urgency);
      paramIdx++;
    }
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const totalCountQuery = `
    WITH latest_preds AS (
      SELECT DISTINCT ON (su.engine_id)
        su.engine_id,
        rp.predicted_rul,
        rp.urgency
      FROM rul_predictions rp
      JOIN sensor_uploads su ON rp.upload_id = su.upload_id
      WHERE rp.status = 'SUCCEEDED'
      ORDER BY su.engine_id, rp.prediction_date DESC
    )
    SELECT COUNT(e.engine_id) AS total
    FROM engines e
    JOIN engine_models em ON e.engine_model_id = em.engine_model_id
    JOIN aircraft a ON e.aircraft_id = a.aircraft_id
    LEFT JOIN latest_preds lp ON e.engine_id = lp.engine_id
    ${whereClause}
  `;
  const totalCountRes = await pool.query(totalCountQuery, params);
  const total = Number(totalCountRes.rows[0]?.total || 0);

  const enginesQuery = `
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
      e.created_at,
      em.engine_model_id,
      em.model_name,
      em.manufacturer AS engine_manufacturer,
      em.engine_family,
      a.aircraft_id,
      a.registration_number AS aircraft_tail,
      a.model AS aircraft_model,
      a.manufacturer AS aircraft_manufacturer,
      lp.predicted_rul,
      lp.urgency,
      lp.prediction_date AS last_analysis
    FROM engines e
    JOIN engine_models em ON e.engine_model_id = em.engine_model_id
    JOIN aircraft a ON e.aircraft_id = a.aircraft_id
    LEFT JOIN latest_preds lp ON e.engine_id = lp.engine_id
    ${whereClause}
    ORDER BY
      CASE
        WHEN lp.urgency = 'PRIORITIZE' THEN 1
        WHEN lp.urgency = 'PREPARE' THEN 2
        WHEN lp.urgency = 'MONITOR' THEN 3
        WHEN lp.urgency = 'NORMAL' THEN 4
        ELSE 5
      END,
      e.engine_code ASC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  params.push(limit, offset);
  const enginesRes = await pool.query(enginesQuery, params);

  return {
    engines: enginesRes.rows.map((row) => ({
      engineId: row.engine_id,
      engineCode: row.engine_code,
      serialNumber: row.serial_number,
      currentCycle: Number(row.current_cycle),
      createdAt: row.created_at,
      model: {
        id: row.engine_model_id,
        name: row.model_name,
        manufacturer: row.engine_manufacturer,
        family: row.engine_family,
      },
      aircraft: {
        id: row.aircraft_id,
        tailNumber: row.aircraft_tail,
        model: row.aircraft_model,
        manufacturer: row.aircraft_manufacturer,
      },
      predictedRul: row.predicted_rul != null ? Number(row.predicted_rul) : null,
      urgency: row.urgency || "NOT_ANALYZED",
      lastAnalysis: row.last_analysis,
    })),
    counts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getEngineById({ companyId, engineId }) {
  const query = `
    WITH latest_preds AS (
      SELECT DISTINCT ON (su.engine_id)
        rp.prediction_id,
        rp.predicted_rul,
        rp.cycle_at_prediction,
        rp.urgency,
        rp.prediction_date,
        rp.explanation,
        mv.model_name AS ml_model_name,
        mv.version AS ml_model_version
      FROM rul_predictions rp
      JOIN sensor_uploads su ON rp.upload_id = su.upload_id
      JOIN ml_model_versions mv ON rp.model_version_id = mv.model_version_id
      WHERE su.engine_id = $2 AND rp.status = 'SUCCEEDED'
      ORDER BY su.engine_id, rp.prediction_date DESC
    )
    SELECT
      e.engine_id,
      e.engine_code,
      e.serial_number,
      e.current_cycle,
      e.created_at,
      em.engine_model_id,
      em.model_name,
      em.manufacturer AS engine_manufacturer,
      em.engine_family,
      em.engine_type,
      a.aircraft_id,
      a.registration_number AS aircraft_tail,
      a.model AS aircraft_model,
      a.manufacturer AS aircraft_manufacturer,
      a.year AS aircraft_year,
      a.status AS aircraft_status,
      lp.prediction_id,
      lp.predicted_rul,
      lp.cycle_at_prediction,
      lp.urgency,
      lp.prediction_date AS last_analysis,
      lp.explanation,
      lp.ml_model_name,
      lp.ml_model_version
    FROM engines e
    JOIN engine_models em ON e.engine_model_id = em.engine_model_id
    JOIN aircraft a ON e.aircraft_id = a.aircraft_id
    LEFT JOIN latest_preds lp ON e.engine_id = $2
    WHERE e.engine_id = $2 AND a.company_id = $1
  `;

  const res = await pool.query(query, [companyId, engineId]);
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    engineId: row.engine_id,
    engineCode: row.engine_code,
    serialNumber: row.serial_number,
    currentCycle: Number(row.current_cycle),
    createdAt: row.created_at,
    model: {
      id: row.engine_model_id,
      name: row.model_name,
      manufacturer: row.engine_manufacturer,
      family: row.engine_family,
      type: row.engine_type,
    },
    aircraft: {
      id: row.aircraft_id,
      tailNumber: row.aircraft_tail,
      model: row.aircraft_model,
      manufacturer: row.aircraft_manufacturer,
      year: row.aircraft_year,
      status: row.aircraft_status,
    },
    latestPrediction: row.prediction_id
      ? {
          predictionId: row.prediction_id,
          predictedRul: Number(row.predicted_rul),
          cycleAtPrediction: Number(row.cycle_at_prediction),
          urgency: row.urgency,
          predictionDate: row.last_analysis,
          explanation: row.explanation,
          modelName: row.ml_model_name,
          modelVersion: row.ml_model_version,
        }
      : null,
  };
}

async function getEngineSensorUploads({ companyId, engineId, limit = 10 }) {
  // Ensure engine belongs to company
  const check = await pool.query(
    `SELECT 1 FROM engines e
     JOIN aircraft a ON e.aircraft_id = a.aircraft_id
     WHERE e.engine_id = $1 AND a.company_id = $2`,
    [engineId, companyId]
  );
  if (check.rows.length === 0) return null;

  const query = `
    SELECT
      su.upload_id,
      su.original_file_name,
      su.first_cycle,
      su.last_cycle,
      su.row_count,
      su.status,
      su.created_at,
      u.full_name AS uploaded_by_name,
      u.email AS uploaded_by_email
    FROM sensor_uploads su
    JOIN users u ON su.uploaded_by = u.user_id
    JOIN engines e ON su.engine_id = e.engine_id
    JOIN aircraft a ON e.aircraft_id = a.aircraft_id
    WHERE su.engine_id = $1 AND a.company_id = $2
    ORDER BY su.created_at DESC
    LIMIT $3
  `;
  const res = await pool.query(query, [engineId, companyId, limit]);
  return res.rows.map((row) => ({
    uploadId: row.upload_id,
    fileName: row.original_file_name,
    firstCycle: row.first_cycle ? Number(row.first_cycle) : null,
    lastCycle: row.last_cycle ? Number(row.last_cycle) : null,
    rowCount: row.row_count,
    status: row.status,
    createdAt: row.created_at,
    uploadedBy: row.uploaded_by_name || row.uploaded_by_email,
  }));
}

module.exports = {
  getEngines,
  getEngineById,
  getEngineSensorUploads,
};
