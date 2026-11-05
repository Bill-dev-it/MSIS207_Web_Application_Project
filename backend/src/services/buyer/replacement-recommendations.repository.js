"use strict";

const pool = require("../../config/db");

async function getOwnedPrediction(client, predictionId, companyId, { lock = false } = {}) {
  const result = await client.query(`
    SELECT p.prediction_id, p.status, p.recommendation_status,
           e.engine_model_id
    FROM public.rul_predictions p
    JOIN public.sensor_uploads u ON u.upload_id = p.upload_id
    JOIN public.engines e ON e.engine_id = u.engine_id
    JOIN public.aircraft a ON a.aircraft_id = e.aircraft_id
    WHERE p.prediction_id = $1 AND a.company_id = $2
    ${lock ? "FOR UPDATE OF p" : ""}
  `, [predictionId, companyId]);
  return result.rows[0] || null;
}

async function getEligibleListings(client, engineModelId) {
  const result = await client.query(`
    SELECT sl.listing_id, sl.product_id, p.product_name, p.manufacturer,
           s.store_name AS supplier_name, sl.condition AS product_condition,
           sl.price::text AS price, sl.stock_quantity, sl.lead_time_days,
           pec.evidence_reference, pec.is_demo AS compatibility_is_demo
    FROM public.product_engine_compatibility pec
    JOIN public.products p ON p.product_id = pec.product_id
    JOIN public.seller_listings sl ON sl.product_id = p.product_id
    JOIN public.suppliers s ON s.supplier_id = sl.supplier_id
    WHERE pec.engine_model_id = $1
      AND p.product_type = 'ENGINE'
      AND p.is_active = TRUE
      AND sl.status = 'ACTIVE'
      AND s.status = 'APPROVED'
      AND sl.stock_quantity > 0
    ORDER BY sl.price ASC, sl.lead_time_days ASC, sl.listing_id ASC
    LIMIT 5
  `, [engineModelId]);
  return result.rows;
}

async function deleteForPrediction(client, predictionId) {
  await client.query(`
    DELETE FROM public.replacement_recommendations
    WHERE prediction_id = $1
  `, [predictionId]);
}

async function saveRecommendation(client, {
  predictionId, listingId, rankPosition, rankingScore, reason, listingSnapshot,
}) {
  await client.query(`
    INSERT INTO public.replacement_recommendations
      (prediction_id, listing_id, rank_position, ranking_score, reason, listing_snapshot)
    VALUES ($1, $2, $3, $4, $5, $6::json)
  `, [predictionId, listingId, rankPosition, rankingScore, reason,
    JSON.stringify(listingSnapshot)]);
}

async function updateRecommendationStatus(client, predictionId, status, configSnapshot) {
  await client.query(`
    UPDATE public.rul_predictions
    SET recommendation_status = $2,
        recommendation_config_snapshot = $3::json
    WHERE prediction_id = $1 AND status = 'SUCCEEDED'
  `, [predictionId, status, JSON.stringify(configSnapshot)]);
}

async function getSavedRecommendations(client, predictionId) {
  const result = await client.query(`
    SELECT rank_position, ranking_score, reason, listing_snapshot
    FROM public.replacement_recommendations
    WHERE prediction_id = $1
    ORDER BY rank_position ASC
  `, [predictionId]);
  return result.rows;
}

async function markRecommendationFailed(predictionId, companyId, configSnapshot) {
  await pool.query(`
    UPDATE public.rul_predictions p
    SET recommendation_status = 'FAILED',
        recommendation_config_snapshot = $3::json
    FROM public.sensor_uploads u
    JOIN public.engines e ON e.engine_id = u.engine_id
    JOIN public.aircraft a ON a.aircraft_id = e.aircraft_id
    WHERE p.upload_id = u.upload_id
      AND p.prediction_id = $1
      AND a.company_id = $2
      AND p.status = 'SUCCEEDED'
      AND p.recommendation_status NOT IN ('READY', 'NO_MATCH')
  `, [predictionId, companyId, JSON.stringify(configSnapshot)]);
}

async function getPredictionAndSavedRecommendations(predictionId, companyId) {
  const client = await pool.connect();
  try {
    const prediction = await getOwnedPrediction(client, predictionId, companyId);
    if (!prediction) return null;
    const recommendations = await getSavedRecommendations(client, predictionId);
    return { prediction, recommendations };
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  getOwnedPrediction,
  getEligibleListings,
  deleteForPrediction,
  saveRecommendation,
  updateRecommendationStatus,
  getSavedRecommendations,
  markRecommendationFailed,
  getPredictionAndSavedRecommendations,
};
