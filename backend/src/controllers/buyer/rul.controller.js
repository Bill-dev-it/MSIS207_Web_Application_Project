"use strict";
const service = require("../../services/buyer/rul.service");
const recommendationService = require("../../services/buyer/replacement-recommendations.service");
const { RulInferenceError } = require("../../services/rul-inference.service");

function errorResponse(res, error) {
  if (error instanceof service.RulError || error instanceof RulInferenceError ||
      error instanceof recommendationService.RecommendationError) {
    return res.status(error.status).json({ success: false, error: { code: error.code, message: error.message } });
  }
  console.error("Buyer RUL error:", error.code || "UNKNOWN");
  return res.status(500).json({ success: false, error: {
    code: "INTERNAL_SERVER_ERROR", message: "Unable to process RUL request." } });
}
async function history(req, res) {
  try {
    const data = await service.getHistory({
      engineId: req.params.engineId, companyId: req.authUser.company_id,
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) { return errorResponse(res, error); }
}
async function predict(req, res) {
  try {
    const result = await service.predict({
      engineId: req.params.engineId,
      userId: req.authUser.user_id,
      companyId: req.authUser.company_id,
      csv: req.body,
      filename: req.get("x-rul-filename"),
      requestKey: req.get("idempotency-key"),
      sourceClassification: req.get("x-rul-source"),
    });
    return res.status(result.replay ? 200 : 201).json({ success: true, data: result.data });
  } catch (error) { return errorResponse(res, error); }
}
async function getRecommendations(req, res) {
  try {
    const data = await recommendationService.getRecommendations({
      predictionId: req.params.predictionId,
      companyId: req.authUser.company_id,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) { return errorResponse(res, error); }
}
async function generateRecommendations(req, res) {
  try {
    const data = await recommendationService.generateRecommendations({
      predictionId: req.params.predictionId,
      companyId: req.authUser.company_id,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) { return errorResponse(res, error); }
}
module.exports = { history, predict, getRecommendations, generateRecommendations };
