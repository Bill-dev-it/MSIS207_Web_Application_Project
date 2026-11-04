const pool = require("../../../config/db");

async function getCompanyEngines({ companyId }) {
  const query = `
    SELECT
      e.engine_id,
      e.engine_code,
      e.serial_number,
      e.current_cycle,
      em.model_name,
      em.engine_model_id,
      a.registration_number AS aircraft_tail,
      a.model AS aircraft_model
    FROM engines e
    JOIN engine_models em ON e.engine_model_id = em.engine_model_id
    JOIN aircraft a ON e.aircraft_id = a.aircraft_id
    WHERE a.company_id = $1
    ORDER BY e.engine_code ASC
  `;
  const res = await pool.query(query, [companyId]);
  return res.rows.map((row) => ({
    engineId: row.engine_id,
    engineCode: row.engine_code,
    serialNumber: row.serial_number,
    currentCycle: Number(row.current_cycle),
    engineModelId: row.engine_model_id,
    modelName: row.model_name,
    aircraftTail: row.aircraft_tail,
    aircraftModel: row.aircraft_model,
  }));
}

async function getActiveModelVersion() {
  const res = await pool.query(
    `SELECT * FROM ml_model_versions WHERE is_active = TRUE ORDER BY model_version_id DESC LIMIT 1`
  );
  return res.rows[0] || null;
}

async function createSensorUpload({
  engineId,
  uploadedBy,
  originalFileName,
  objectKey,
  fileSha256,
  datasetSubset,
  datasetUnitId,
  firstCycle,
  lastCycle,
  rowCount,
  status = "VALID",
  validationError = null,
}) {
  const query = `
    INSERT INTO sensor_uploads (
      engine_id,
      uploaded_by,
      original_file_name,
      object_key,
      file_sha256,
      dataset_subset,
      dataset_unit_id,
      first_cycle,
      last_cycle,
      row_count,
      status,
      validation_error
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    ) RETURNING *;
  `;
  const values = [
    engineId,
    uploadedBy,
    originalFileName,
    objectKey,
    fileSha256,
    datasetSubset,
    datasetUnitId,
    firstCycle,
    lastCycle,
    rowCount,
    status,
    validationError,
  ];
  const res = await pool.query(query, values);
  return res.rows[0];
}

async function createPredictionRecord({
  engineId,
  uploadId,
  modelVersionId,
  requestedBy,
  requestKey,
  predictedRul,
  cycleAtPrediction,
  urgency,
  decisionRuleSnapshot,
  explanation,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertPredQuery = `
      INSERT INTO rul_predictions (
        upload_id,
        model_version_id,
        requested_by,
        request_key,
        status,
        predicted_rul,
        cycle_at_prediction,
        urgency,
        decision_rule_snapshot,
        recommendation_config_snapshot,
        recommendation_status,
        explanation,
        completed_at
      ) VALUES (
        $1, $2, $3, $4, 'SUCCEEDED', $5, $6, $7, $8, $9, 'READY', $10, CURRENT_TIMESTAMP
      ) RETURNING *;
    `;

    const predValues = [
      uploadId,
      modelVersionId,
      requestedBy,
      requestKey,
      predictedRul,
      cycleAtPrediction,
      urgency,
      JSON.stringify(decisionRuleSnapshot),
      JSON.stringify({ auto_match: true, max_recommendations: 5 }),
      explanation,
    ];

    const predRes = await client.query(insertPredQuery, predValues);
    const prediction = predRes.rows[0];

    // Find compatible replacement listings in marketplace
    const engRes = await client.query(
      "SELECT engine_model_id FROM engines WHERE engine_id = $1",
      [engineId]
    );
    const engineModelId = engRes.rows[0]?.engine_model_id;

    if (engineModelId) {
      const matchQuery = `
        SELECT
          sl.listing_id,
          sl.price,
          sl.stock_quantity,
          sl.condition,
          sl.seller_sku,
          p.product_id,
          p.product_name,
          p.part_number,
          p.manufacturer,
          s.store_name,
          pec.evidence_reference
        FROM product_engine_compatibility pec
        JOIN products p ON pec.product_id = p.product_id
        JOIN seller_listings sl ON p.product_id = sl.product_id
        JOIN suppliers s ON sl.supplier_id = s.supplier_id
        WHERE pec.engine_model_id = $1
          AND sl.status = 'ACTIVE'
          AND sl.stock_quantity > 0
        ORDER BY sl.price ASC
        LIMIT 5;
      `;
      const matchRes = await client.query(matchQuery, [engineModelId]);

      for (let i = 0; i < matchRes.rows.length; i++) {
        const item = matchRes.rows[i];
        const rank = i + 1;
        const rankingScore = Math.max(0.1, 1.0 - i * 0.15);
        const reason = `High-demand replacement part compatible with engine model. Fitment verified: ${item.evidence_reference}`;

        await client.query(
          `INSERT INTO replacement_recommendations (
             prediction_id,
             listing_id,
             rank_position,
             ranking_score,
             reason,
             listing_snapshot
           ) VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (prediction_id, listing_id) DO NOTHING`,
          [
            prediction.prediction_id,
            item.listing_id,
            rank,
            rankingScore,
            reason,
            JSON.stringify(item),
          ]
        );
      }
    }

    // Update current_cycle on the engine
    await client.query(
      `UPDATE engines SET current_cycle = $1 WHERE engine_id = $2`,
      [cycleAtPrediction, engineId]
    );

    await client.query("COMMIT");
    return prediction;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getEnginePredictionHistory({ companyId, engineId }) {
  // Ensure access
  const check = await pool.query(
    `SELECT 1 FROM engines e
     JOIN aircraft a ON e.aircraft_id = a.aircraft_id
     WHERE e.engine_id = $1 AND a.company_id = $2`,
    [engineId, companyId]
  );
  if (check.rows.length === 0) return null;

  const query = `
    SELECT
      rp.prediction_id,
      rp.upload_id,
      rp.predicted_rul,
      rp.cycle_at_prediction,
      rp.urgency,
      rp.prediction_date,
      rp.explanation,
      rp.status,
      mv.model_name AS ml_model_name,
      mv.version AS ml_model_version,
      su.original_file_name
    FROM rul_predictions rp
    JOIN ml_model_versions mv ON rp.model_version_id = mv.model_version_id
    JOIN sensor_uploads su ON rp.upload_id = su.upload_id
    WHERE su.engine_id = $1 AND rp.status = 'SUCCEEDED'
    ORDER BY rp.prediction_date ASC;
  `;
  const res = await pool.query(query, [engineId]);
  return res.rows.map((row) => ({
    predictionId: row.prediction_id,
    uploadId: row.upload_id,
    predictedRul: Number(row.predicted_rul),
    cycle: Number(row.cycle_at_prediction),
    urgency: row.urgency,
    predictionDate: row.prediction_date,
    explanation: row.explanation,
    modelName: row.ml_model_name,
    modelVersion: row.ml_model_version,
    fileName: row.original_file_name,
  }));
}

async function getPredictionDetailWithRecommendations(predictionId) {
  const predQuery = `
    SELECT
      rp.*,
      su.engine_id,
      e.engine_code,
      e.serial_number,
      em.model_name AS engine_model_name,
      mv.model_name AS ml_model_name,
      mv.version AS ml_model_version
    FROM rul_predictions rp
    JOIN sensor_uploads su ON rp.upload_id = su.upload_id
    JOIN engines e ON su.engine_id = e.engine_id
    JOIN engine_models em ON e.engine_model_id = em.engine_model_id
    JOIN ml_model_versions mv ON rp.model_version_id = mv.model_version_id
    WHERE rp.prediction_id = $1;
  `;
  const predRes = await pool.query(predQuery, [predictionId]);
  if (predRes.rows.length === 0) return null;
  const pred = predRes.rows[0];

  const recQuery = `
    SELECT
      rr.recommendation_id,
      rr.rank_position,
      rr.ranking_score,
      rr.reason,
      rr.listing_snapshot
    FROM replacement_recommendations rr
    WHERE rr.prediction_id = $1
    ORDER BY rr.rank_position ASC;
  `;
  const recRes = await pool.query(recQuery, [predictionId]);

  return {
    predictionId: pred.prediction_id,
    engineId: pred.engine_id,
    engineCode: pred.engine_code,
    serialNumber: pred.serial_number,
    engineModelName: pred.engine_model_name,
    predictedRul: Number(pred.predicted_rul),
    cycle: Number(pred.cycle_at_prediction),
    urgency: pred.urgency,
    predictionDate: pred.prediction_date,
    explanation: pred.explanation,
    modelName: pred.ml_model_name,
    modelVersion: pred.ml_model_version,
    recommendations: recRes.rows.map((r) => ({
      recommendationId: r.recommendation_id,
      rank: r.rank_position,
      score: Number(r.ranking_score),
      reason: r.reason,
      listing: r.listing_snapshot,
    })),
  };
}

module.exports = {
  getCompanyEngines,
  getActiveModelVersion,
  createSensorUpload,
  createPredictionRecord,
  getEnginePredictionHistory,
  getPredictionDetailWithRecommendations,
};
