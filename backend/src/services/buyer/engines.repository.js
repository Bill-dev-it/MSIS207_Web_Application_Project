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

/**
 * Search available engine models from the catalog
 */
async function searchEngineModels({ search = "", limit = 20 }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const params = [];
  let query = `
    SELECT
      engine_model_id,
      manufacturer,
      model_name,
      engine_family,
      engine_type
    FROM engine_models
  `;
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    query += `
      WHERE model_name ILIKE $1
         OR manufacturer ILIKE $1
         OR engine_family ILIKE $1
    `;
  }
  params.push(safeLimit);
  query += ` ORDER BY model_name ASC LIMIT $${params.length}`;

  const res = await pool.query(query, params);
  return res.rows.map((row) => ({
    engineModelId: row.engine_model_id,
    manufacturer: row.manufacturer,
    modelName: row.model_name,
    engineFamily: row.engine_family,
    engineType: row.engine_type,
  }));
}

/**
 * List aircraft owned by the buyer company
 */
async function getCompanyAircraft({ companyId }) {
  const query = `
    SELECT
      aircraft_id,
      registration_number,
      manufacturer,
      model,
      aircraft_type,
      year,
      status,
      created_at
    FROM aircraft
    WHERE company_id = $1
    ORDER BY registration_number ASC
  `;
  const res = await pool.query(query, [companyId]);
  return res.rows.map((row) => ({
    aircraftId: row.aircraft_id,
    registrationNumber: row.registration_number,
    manufacturer: row.manufacturer,
    model: row.model,
    aircraftType: row.aircraft_type,
    year: row.year,
    status: row.status,
    createdAt: row.created_at,
  }));
}

/**
 * Register a new engine, optionally creating a new aircraft for the company in a single transaction.
 */
async function createEngineWithAircraft({
  companyId,
  engineCode,
  serialNumber,
  currentCycle = 0,
  engineModelId,
  aircraftId,
  newAircraft,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let resolvedAircraftId = aircraftId;

    if (!resolvedAircraftId && newAircraft) {
      const aircraftRes = await client.query(
        `INSERT INTO aircraft (
           company_id,
           registration_number,
           manufacturer,
           model,
           aircraft_type,
           year,
           status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING aircraft_id`,
        [
          companyId,
          newAircraft.registrationNumber,
          newAircraft.manufacturer,
          newAircraft.model,
          newAircraft.aircraftType || "Commercial Fixed-Wing",
          newAircraft.year || null,
          newAircraft.status || "ACTIVE",
        ]
      );
      resolvedAircraftId = aircraftRes.rows[0].aircraft_id;
    } else {
      const checkAircraft = await client.query(
        `SELECT aircraft_id FROM aircraft WHERE aircraft_id = $1 AND company_id = $2`,
        [resolvedAircraftId, companyId]
      );
      if (checkAircraft.rows.length === 0) {
        const err = new Error("Aircraft not found for your company.");
        err.statusCode = 404;
        err.code = "AIRCRAFT_NOT_FOUND";
        throw err;
      }
    }

    const checkModel = await client.query(
      `SELECT engine_model_id FROM engine_models WHERE engine_model_id = $1`,
      [engineModelId]
    );
    if (checkModel.rows.length === 0) {
      const err = new Error("Selected engine model does not exist.");
      err.statusCode = 400;
      err.code = "INVALID_ENGINE_MODEL";
      throw err;
    }

    const engineRes = await client.query(
      `INSERT INTO engines (
         aircraft_id,
         engine_model_id,
         engine_code,
         serial_number,
         current_cycle
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING engine_id`,
      [resolvedAircraftId, engineModelId, engineCode, serialNumber, currentCycle]
    );

    await client.query("COMMIT");
    return engineRes.rows[0].engine_id;
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      if (err.constraint === "uq_engines_aircraft_code") {
        const e = new Error("An engine with this code is already assigned to this aircraft.");
        e.statusCode = 409;
        e.code = "DUPLICATE_ENGINE_CODE";
        throw e;
      }
      if (err.constraint === "uq_engines_model_serial") {
        const e = new Error("An engine with this model and serial number already exists.");
        e.statusCode = 409;
        e.code = "DUPLICATE_SERIAL_NUMBER";
        throw e;
      }
      if (err.constraint === "aircraft_registration_number_key" || err.detail?.includes("registration_number")) {
        const e = new Error("An aircraft with this registration number already exists.");
        e.statusCode = 409;
        e.code = "DUPLICATE_REGISTRATION_NUMBER";
        throw e;
      }
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Update editable engine details for an engine owned by the buyer's company.
 */
async function updateEngine({ companyId, engineId, engineCode, serialNumber, currentCycle }) {
  const check = await pool.query(
    `SELECT e.engine_id, e.aircraft_id, e.engine_model_id
     FROM engines e
     JOIN aircraft a ON e.aircraft_id = a.aircraft_id
     WHERE e.engine_id = $1 AND a.company_id = $2`,
    [engineId, companyId]
  );
  if (check.rows.length === 0) {
    const err = new Error("Engine not found.");
    err.statusCode = 404;
    err.code = "ENGINE_NOT_FOUND";
    throw err;
  }

  try {
    await pool.query(
      `UPDATE engines
       SET engine_code = $1,
           serial_number = $2,
           current_cycle = $3
       WHERE engine_id = $4`,
      [engineCode, serialNumber, currentCycle, engineId]
    );
    return engineId;
  } catch (err) {
    if (err.code === "23505") {
      if (err.constraint === "uq_engines_aircraft_code") {
        const e = new Error("An engine with this code is already assigned to this aircraft.");
        e.statusCode = 409;
        e.code = "DUPLICATE_ENGINE_CODE";
        throw e;
      }
      if (err.constraint === "uq_engines_model_serial") {
        const e = new Error("An engine with this model and serial number already exists.");
        e.statusCode = 409;
        e.code = "DUPLICATE_SERIAL_NUMBER";
        throw e;
      }
    }
    throw err;
  }
}

module.exports = {
  getEngines,
  getEngineById,
  getEngineSensorUploads,
  searchEngineModels,
  getCompanyAircraft,
  createEngineWithAircraft,
  updateEngine,
};
