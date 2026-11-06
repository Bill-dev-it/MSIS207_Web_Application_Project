"use strict";
const pool = require("../../config/db");

const MODEL_NAME = "condition_aware_itransformer_v3";
const MODEL_VERSION = "fd002-seed42-v3";

async function getOwnedEngine(engineId, companyId) {
  const result = await pool.query(`
    SELECT e.engine_id, e.engine_code, e.serial_number, e.current_cycle,
           e.engine_model_id, a.company_id
    FROM public.engines e
    JOIN public.aircraft a ON a.aircraft_id = e.aircraft_id
    WHERE e.engine_id = $1 AND a.company_id = $2
  `, [engineId, companyId]);
  return result.rows[0] || null;
}

async function getModelVersion() {
  const result = await pool.query(`
    SELECT model_version_id, model_name, version, dataset_subset, window_size
    FROM public.ml_model_versions
    WHERE model_name = $1 AND version = $2 AND dataset_subset = 'FD002'
      AND window_size = 30 AND is_active = TRUE
    LIMIT 1
  `, [MODEL_NAME, MODEL_VERSION]);
  return result.rows[0] || null;
}

async function getByRequestKey(requestKey) {
  const result = await pool.query(`
    SELECT p.prediction_id, p.request_key, p.requested_by, p.status,
           p.predicted_rul, p.urgency, p.cycle_at_prediction,
           p.decision_rule_snapshot, p.prediction_date, p.completed_at,
           u.upload_id, u.engine_id, u.file_sha256,
           u.dataset_subset AS source_classification,
           u.dataset_unit_id, u.row_count, u.is_demo,
           m.model_name, m.version, m.dataset_subset AS model_dataset_subset
    FROM public.rul_predictions p
    JOIN public.sensor_uploads u ON u.upload_id = p.upload_id
    JOIN public.ml_model_versions m ON m.model_version_id = p.model_version_id
    WHERE p.request_key = $1
  `, [requestKey]);
  return result.rows[0] || null;
}

async function saveSuccess({ engineId, userId, filename, objectKey, fileSha256,
  sourceClassification, datasetUnitId, firstCycle, lastCycle, rowCount, modelVersionId, requestKey,
  prediction, urgency, decisionRule }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const upload = await client.query(`
      INSERT INTO public.sensor_uploads
        (engine_id, uploaded_by, original_file_name, object_key, file_sha256,
         dataset_subset, dataset_unit_id, first_cycle, last_cycle, row_count, is_demo, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,'VALID')
      RETURNING upload_id
    `, [engineId, userId, filename, objectKey, fileSha256,
      sourceClassification, datasetUnitId, firstCycle, lastCycle, rowCount]);
    const saved = await client.query(`
      INSERT INTO public.rul_predictions
        (upload_id, model_version_id, requested_by, request_key, status,
         predicted_rul, cycle_at_prediction, urgency, decision_rule_snapshot,
         recommendation_status, explanation, completed_at)
      VALUES ($1,$2,$3,$4,'SUCCEEDED',$5,$6,$7,$8::json,'NOT_RUN',$9,CURRENT_TIMESTAMP)
      RETURNING prediction_id, completed_at
    `, [upload.rows[0].upload_id, modelVersionId, userId, requestKey,
      prediction, lastCycle, urgency, JSON.stringify(decisionRule),
      "C-MAPSS FD002 educational simulation; not an airworthiness or compatibility decision."]);
    await client.query("COMMIT");
    return { ...saved.rows[0], upload_id: upload.rows[0].upload_id };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Buyer RUL transaction rollback failed:", rollbackError.code || "UNKNOWN");
    }
    throw error;
  } finally {
    client.release();
  }
}

async function getHistory(engineId, companyId, limit) {
  const result = await pool.query(`
    SELECT p.prediction_id, p.request_key, p.status, p.recommendation_status, p.predicted_rul,
           p.cycle_at_prediction, p.urgency, p.prediction_date, p.completed_at,
           p.explanation, u.upload_id, u.original_file_name,
           u.dataset_subset AS source_classification,
           u.dataset_unit_id, u.row_count, u.is_demo,
           m.model_name, m.version, m.dataset_subset AS model_dataset_subset
    FROM public.rul_predictions p
    JOIN public.sensor_uploads u ON u.upload_id = p.upload_id
    JOIN public.engines e ON e.engine_id = u.engine_id
    JOIN public.aircraft a ON a.aircraft_id = e.aircraft_id
    JOIN public.ml_model_versions m ON m.model_version_id = p.model_version_id
    WHERE u.engine_id = $1 AND a.company_id = $2
    ORDER BY p.prediction_date DESC, p.prediction_id DESC LIMIT $3
  `, [engineId, companyId, limit]);
  return result.rows;
}

module.exports = { MODEL_NAME, MODEL_VERSION, getOwnedEngine,
  getModelVersion, getByRequestKey, saveSuccess, getHistory };
