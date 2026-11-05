"use strict";
const router = require("express").Router();
const express = require("express");
const controller = require("../../controllers/buyer/rul.controller");

function parseCsvBody(req, res, next) {
  const contentType = req.get("content-type") || "";
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  const charset = contentType.match(/;\s*charset\s*=\s*"?([^;"\s]+)"?/i)?.[1];
  if (mediaType !== "text/csv" || (charset && charset.toLowerCase() !== "utf-8")) {
    return res.status(415).json({ success: false, error: {
      code: "UNSUPPORTED_MEDIA_TYPE", message: "Upload CSV as UTF-8 text/csv."
    } });
  }
  express.text({ type: "text/csv", limit: "1mb" })(req, res, error => {
    if (!error) return next();
    if (error.type === "entity.too.large") {
      return res.status(413).json({ success: false, error: {
        code: "PAYLOAD_TOO_LARGE", message: "CSV must be 1 MiB or smaller."
      } });
    }
    if (error.status === 415 || error.type === "charset.unsupported" ||
        error.type === "encoding.unsupported") {
      return res.status(415).json({ success: false, error: {
        code: "UNSUPPORTED_MEDIA_TYPE", message: "Upload CSV as UTF-8 text/csv."
      } });
    }
    console.error("Buyer RUL CSV parser error:", error.type || "UNKNOWN");
    return res.status(400).json({ success: false, error: {
      code: "INVALID_REQUEST_BODY", message: "Unable to parse the CSV request body."
    } });
  });
}

/**
 * @api {get} /api/v1/rul/engines/:engineId/history List engine RUL history
 * @apiName GetBuyerRulHistory
 * @apiGroup Buyer RUL
 * @apiVersion 1.0.0
 * @apiPermission Buyer
 * @apiDescription Returns stored predictions for an engine owned by the authenticated Buyer's company. No inference is run.
 * @apiParam {String} engineId Positive BIGINT engine ID.
 * @apiQuery {Number} [limit=10] Page size 1–50.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Stored prediction records including source_classification and model training subset. Legacy records without provenance return LEGACY_UNCLASSIFIED.
 * @apiError (401 Unauthorized) AUTH_REQUIRED JWT cookie is missing or invalid.
 * @apiError (403 Forbidden) BUYER_REQUIRED Buyer role is required.
 * @apiError (404 Not Found) ENGINE_NOT_FOUND The engine is unavailable for this company.
 * @apiError (400 Bad Request) INVALID_ENGINE_ID or INVALID_LIMIT Invalid input.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unable to retrieve history.
 */
router.get("/engines/:engineId/history", controller.history);

/**
 * @api {post} /api/v1/rul/engines/:engineId/predict Predict engine RUL from CSV
 * @apiName PredictBuyerEngineRul
 * @apiGroup Buyer RUL
 * @apiVersion 1.0.0
 * @apiPermission Buyer
 * @apiDescription Upload a compatible sensor CSV classified as a NASA C-MAPSS FD002 sample, custom synthetic telemetry, or externally sourced mapped telemetry. Express sends the CSV to the internal FastAPI service, which runs the frozen FD002-trained Condition-Aware iTransformer checkpoint; Express persists the successful prediction. The source classification is a user-declared provenance label, not a verification of origin or prediction accuracy. Returns 201 for a new prediction and 200 for a same-key, same-input, same-source replay. Requires the existing HttpOnly session cookie and X-AeroRUL-Request: 1.
 * @apiParam {String} engineId Positive BIGINT engine ID owned by the Buyer company.
 * @apiHeader {String} Content-Type text/csv; charset=utf-8
 * @apiHeader {String} X-AeroRUL-Request 1
 * @apiHeader {String} X-RUL-Filename Safe filename ending in .csv.
 * @apiHeader {String="NASA_CMAPSS_FD002","CUSTOM_SYNTHETIC","EXTERNAL_MAPPED"} X-RUL-Source User-selected upload source classification.
 * @apiHeader {String} Idempotency-Key Unique UUID for this logical prediction request.
 * @apiBody {String} body Raw UTF-8 CSV with 19 required input columns, one unit, at least 30 observations, no ground-truth RUL labels, and raw unscaled values in compatible physical units. Maximum 1 MiB.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Result with predicted_rul in engine_cycles, urgency, source_classification, FD002 model metadata, input_summary and database IDs.
 * @apiSuccessExample {json} 201 Created:
 *     { "success": true, "data": { "prediction_id": "123", "engine_id": "37", "status": "SUCCEEDED", "predicted_rul": 22.5, "unit": "engine_cycles", "urgency": "PREPARE", "source_classification": "EXTERNAL_MAPPED", "model": { "dataset_subset": "FD002" }, "is_demo": true } }
 * @apiError (401 Unauthorized) AUTH_REQUIRED No valid Buyer session.
 * @apiError (403 Forbidden) BUYER_REQUIRED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Buyer role and trusted origin required.
 * @apiError (400 Bad Request) INVALID_ENGINE_ID, INVALID_FILENAME, INVALID_REQUEST_KEY, INVALID_SOURCE_CLASSIFICATION or INVALID_REQUEST_BODY Invalid request data or metadata.
 * @apiError (404 Not Found) ENGINE_NOT_FOUND The engine is unavailable for this company.
 * @apiError (409 Conflict) IDEMPOTENCY_CONFLICT Request key reused with different data.
 * @apiError (413 Payload Too Large) PAYLOAD_TOO_LARGE or INVALID_FILE_SIZE CSV exceeds 1 MiB.
 * @apiError (415 Unsupported Media Type) UNSUPPORTED_MEDIA_TYPE or INVALID_CONTENT_TYPE Upload must be UTF-8 text/csv.
 * @apiError (422 Unprocessable Entity) INVALID_SENSOR_CSV or INSUFFICIENT_HISTORY Invalid compatible sensor CSV.
 * @apiError (429 Too Many Requests) RUL_BUSY Another prediction is currently running.
 * @apiError (502 Bad Gateway) RUL_FAILURE or MODEL_MISMATCH Invalid inference output or model result.
 * @apiError (503 Service Unavailable) MODEL_NOT_REGISTERED, RUL_UNAVAILABLE or RUL_FAILURE Model metadata/runtime is not ready or inference failed.
 * @apiError (504 Gateway Timeout) RUL_TIMEOUT Inference exceeded the process timeout.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unable to process the request.
 */
router.post("/engines/:engineId/predict", parseCsvBody, controller.predict);

/**
 * @api {post} /api/v1/rul/predictions/:predictionId/recommendations Generate replacement engine recommendations
 * @apiName GenerateBuyerEngineReplacementRecommendations
 * @apiGroup Buyer RUL
 * @apiVersion 1.0.0
 * @apiPermission Buyer
 * @apiDescription Generates and saves up to five eligible replacement engine listings for a successfully stored prediction owned by the authenticated Buyer's company. Eligibility requires exact engine-model compatibility evidence, an active ENGINE product, ACTIVE listing, APPROVED supplier, and positive stock. Ranking is lower actual listing price, then shorter lead time, then listing ID. Generation is transactional and idempotent. Requires the existing session cookie and X-AeroRUL-Request: 1.
 * @apiParam {String} predictionId Positive BIGINT ID of a successful company-owned prediction.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Includes prediction_id, recommendation_status (READY or NO_MATCH), already_saved, and saved ranked recommendations.
 * @apiSuccessExample {json} 200 OK:
 *     { "success": true, "data": { "prediction_id": "51", "recommendation_status": "READY", "already_saved": false, "recommendations": [{ "rank_position": 1, "listing_id": "81", "product_id": "12", "product_name": "Replacement Engine", "manufacturer": "Example Aero", "supplier_name": "Approved Engines", "condition": "NEW", "price": "120000.00", "currency": "USD", "stock_quantity": 2, "lead_time_days": 14, "compatibility": { "evidence_reference": "compatibility record 12/4", "is_demo": true }, "reason": "Top 1: Recorded demo compatibility evidence links this engine model to the listed engine. Ranked by lower actual listing price, then shorter lead time, then listing ID. Compatibility is not certified for aircraft installation." }] } }
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or invalid Buyer session.
 * @apiError (403 Forbidden) BUYER_REQUIRED or UNTRUSTED_REQUEST Buyer role or trusted mutation required.
 * @apiError (400 Bad Request) INVALID_PREDICTION_ID Prediction ID must be a positive BIGINT.
 * @apiError (404 Not Found) RUL_PREDICTION_NOT_FOUND No successful prediction is visible to this Buyer company.
 * @apiError (409 Conflict) RUL_PREDICTION_NOT_SUCCESSFUL The prediction has not succeeded.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Recommendation generation failed; the saved RUL prediction remains successful.
 */
router.post("/predictions/:predictionId/recommendations", controller.generateRecommendations);

/**
 * @api {get} /api/v1/rul/predictions/:predictionId/recommendations Get saved replacement engine recommendations
 * @apiName GetBuyerEngineReplacementRecommendations
 * @apiGroup Buyer RUL
 * @apiVersion 1.0.0
 * @apiPermission Buyer
 * @apiDescription Retrieves only persisted recommendations for a successful prediction owned by the authenticated Buyer's company. This read-only request never runs inference or generates recommendations.
 * @apiParam {String} predictionId Positive BIGINT ID of a successful company-owned prediction.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Includes prediction_id, recommendation_status (NOT_RUN, READY, NO_MATCH, or FAILED), already_saved, and saved ranked recommendations.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or invalid Buyer session.
 * @apiError (403 Forbidden) BUYER_REQUIRED Buyer role required.
 * @apiError (400 Bad Request) INVALID_PREDICTION_ID Prediction ID must be a positive BIGINT.
 * @apiError (404 Not Found) RUL_PREDICTION_NOT_FOUND No successful prediction is visible to this Buyer company.
 * @apiError (409 Conflict) RUL_PREDICTION_NOT_SUCCESSFUL The prediction has not succeeded.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unable to retrieve saved recommendations.
 */
router.get("/predictions/:predictionId/recommendations", controller.getRecommendations);

module.exports = router;
