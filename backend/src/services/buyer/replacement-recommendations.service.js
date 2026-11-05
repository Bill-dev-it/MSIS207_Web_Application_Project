"use strict";

const repository = require("./replacement-recommendations.repository");

const MAX_BIGINT = 9223372036854775807n;
const MAX_RECOMMENDATIONS = 5;
const RECOMMENDATION_CONFIG = Object.freeze({
  version: "engine-replacement-mvp-v1",
  eligibility: [
    "company_owned_prediction",
    "successful_prediction",
    "exact_engine_model_compatibility",
    "engine_product",
    "active_product",
    "active_listing",
    "approved_supplier",
    "positive_stock",
  ],
  order_by: ["price_asc", "lead_time_days_asc", "listing_id_asc"],
  maximum_results: MAX_RECOMMENDATIONS,
  ranking_score: "ordinal rank weight (6 - rank_position); not a compatibility score",
  currency: "USD",
});

class RecommendationError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = "RecommendationError";
    this.code = code;
    this.status = status;
  }
}

function validId(id) {
  return typeof id === "string" && /^[1-9]\d*$/.test(id) && BigInt(id) <= MAX_BIGINT;
}

function ownedPredictionOrError(prediction) {
  if (!prediction) {
    throw new RecommendationError("RUL_PREDICTION_NOT_FOUND", 404,
      "Successful prediction not found for your company.");
  }
  if (prediction.status !== "SUCCEEDED") {
    throw new RecommendationError("RUL_PREDICTION_NOT_SUCCESSFUL", 409,
      "Recommendations require a successfully stored RUL prediction.");
  }
}

function unpackSnapshot(value) {
  if (typeof value === "string") return JSON.parse(value);
  return value;
}

function formatRecommendation(row) {
  const snapshot = unpackSnapshot(row.listing_snapshot);
  return {
    ...snapshot,
    rank_position: Number(row.rank_position),
    ranking_score: Number(row.ranking_score),
    reason: row.reason,
  };
}

function responseData(predictionId, status, rows, alreadySaved = ["READY", "NO_MATCH"].includes(status)) {
  return {
    prediction_id: String(predictionId),
    recommendation_status: status,
    already_saved: alreadySaved,
    recommendations: rows.map(formatRecommendation),
  };
}

function makeListingSnapshot(row) {
  return {
    listing_id: String(row.listing_id),
    product_id: String(row.product_id),
    product_name: row.product_name,
    manufacturer: row.manufacturer,
    supplier_name: row.supplier_name,
    condition: row.product_condition,
    price: String(row.price),
    currency: RECOMMENDATION_CONFIG.currency,
    stock_quantity: Number(row.stock_quantity),
    lead_time_days: Number(row.lead_time_days),
    compatibility: {
      evidence_reference: row.evidence_reference,
      is_demo: row.compatibility_is_demo,
    },
  };
}

function recommendationReason(snapshot, rankPosition) {
  const evidenceType = snapshot.compatibility.is_demo
    ? "Recorded demo compatibility evidence"
    : "Recorded compatibility evidence";
  return `Top ${rankPosition}: ${evidenceType} links this engine model to the listed engine. ` +
    `Ranked by lower actual listing price, then shorter lead time, then listing ID. ` +
    "Compatibility is not certified for aircraft installation.";
}

async function getRecommendations({ predictionId, companyId }) {
  if (!validId(predictionId)) {
    throw new RecommendationError("INVALID_PREDICTION_ID", 400,
      "Prediction ID must be a positive BIGINT string.");
  }
  const result = await repository.getPredictionAndSavedRecommendations(predictionId, companyId);
  ownedPredictionOrError(result?.prediction);
  return responseData(predictionId, result.prediction.recommendation_status, result.recommendations);
}

async function generateRecommendations({ predictionId, companyId }) {
  if (!validId(predictionId)) {
    throw new RecommendationError("INVALID_PREDICTION_ID", 400,
      "Prediction ID must be a positive BIGINT string.");
  }

  const client = await repository.pool.connect();
  let transactionOpen = false;
  let generationStarted = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;

    const prediction = await repository.getOwnedPrediction(client, predictionId, companyId, { lock: true });
    ownedPredictionOrError(prediction);

    if (["READY", "NO_MATCH"].includes(prediction.recommendation_status)) {
      const saved = await repository.getSavedRecommendations(client, predictionId);
      await client.query("COMMIT");
      transactionOpen = false;
      return responseData(predictionId, prediction.recommendation_status, saved);
    }

    generationStarted = true;
    const listings = await repository.getEligibleListings(client, prediction.engine_model_id);
    await repository.deleteForPrediction(client, predictionId);

    for (const [index, listing] of listings.entries()) {
      const rankPosition = index + 1;
      const snapshot = makeListingSnapshot(listing);
      await repository.saveRecommendation(client, {
        predictionId,
        listingId: listing.listing_id,
        rankPosition,
        rankingScore: MAX_RECOMMENDATIONS + 1 - rankPosition,
        reason: recommendationReason(snapshot, rankPosition),
        listingSnapshot: snapshot,
      });
    }

    const status = listings.length ? "READY" : "NO_MATCH";
    await repository.updateRecommendationStatus(client, predictionId, status, RECOMMENDATION_CONFIG);
    const saved = await repository.getSavedRecommendations(client, predictionId);
    await client.query("COMMIT");
    transactionOpen = false;
    return responseData(predictionId, status, saved, false);
  } catch (error) {
    let rollbackSucceeded = !transactionOpen;
    if (transactionOpen) {
      try {
        await client.query("ROLLBACK");
        rollbackSucceeded = true;
      } catch (rollbackError) {
        console.error("Recommendation transaction rollback failed:",
          rollbackError.code || "UNKNOWN");
      }
      transactionOpen = false;
    }
    if (generationStarted) {
      if (rollbackSucceeded) {
        try {
          await repository.markRecommendationFailed(predictionId, companyId, RECOMMENDATION_CONFIG);
        } catch (statusError) {
          console.error("Could not record failed recommendation generation:",
            statusError.code || "UNKNOWN");
        }
      } else {
        console.error("Could not record failed recommendation generation: transaction rollback failed");
      }
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { RecommendationError, getRecommendations, generateRecommendations };
