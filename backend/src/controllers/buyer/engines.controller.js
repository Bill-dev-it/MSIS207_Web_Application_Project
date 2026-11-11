"use strict";

const service = require("../../services/buyer/engines.service");
const MAX_ID = 9223372036854775807n;

function isId(value) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value) && BigInt(value) <= MAX_ID;
}

function integerQuery(value, fallback, max) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value) || Number(value) > max) {
    const error = new Error(`Value must be an integer between 1 and ${max}.`);
    error.statusCode = 400;
    error.code = "INVALID_QUERY";
    throw error;
  }
  return Number(value);
}

function fail(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error("Buyer engines request failed:", error);
  return res.status(status).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: status >= 500 ? "Unable to process engine request." : error.message,
    },
  });
}

async function listEngines(req, res) {
  try {
    const search = req.query.search ?? "";
    const urgency = req.query.urgency ?? "ALL";
    if (typeof search !== "string" || typeof urgency !== "string") {
      const error = new Error("Search and urgency filters must be single text values.");
      error.statusCode = 400;
      error.code = "INVALID_QUERY";
      throw error;
    }
    if (search.length > 200) {
      const error = new Error("Search text must be at most 200 characters.");
      error.statusCode = 400;
      error.code = "INVALID_SEARCH";
      throw error;
    }
    const data = await service.listEngines({
      companyId: req.authUser.company_id,
      search,
      urgency,
      page: integerQuery(req.query.page, 1, 1000000),
      limit: integerQuery(req.query.limit, 10, 100),
    });
    const { engines, ...meta } = data;
    return res.status(200).json({ success: true, data: engines, meta });
  } catch (error) {
    return fail(res, error);
  }
}

async function getEngineDetail(req, res) {
  if (!isId(req.params.engineId)) {
    return res.status(400).json({ success: false, error: {
      code: "INVALID_ENGINE_ID", message: "Engine ID must be a positive BIGINT."
    } });
  }
  try {
    const data = await service.getEngineDetail({
      companyId: req.authUser.company_id,
      engineId: req.params.engineId,
    });
    if (!data) return res.status(404).json({ success: false, error: {
      code: "ENGINE_NOT_FOUND", message: "Engine not found."
    } });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function getSensorUploads(req, res) {
  if (!isId(req.params.engineId)) {
    return res.status(400).json({ success: false, error: {
      code: "INVALID_ENGINE_ID", message: "Engine ID must be a positive BIGINT."
    } });
  }
  try {
    const data = await service.getSensorUploads({
      companyId: req.authUser.company_id,
      engineId: req.params.engineId,
      limit: integerQuery(req.query.limit, 10, 100),
    });
    if (data === null) return res.status(404).json({ success: false, error: {
      code: "ENGINE_NOT_FOUND", message: "Engine not found."
    } });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function listEngineModels(req, res) {
  try {
    const search = req.query.search ?? "";
    const limit = integerQuery(req.query.limit, 20, 50);
    const data = await service.listEngineModels({ search, limit });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function listCompanyAircraft(req, res) {
  try {
    const data = await service.listCompanyAircraft({
      companyId: req.authUser.company_id,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

async function createEngine(req, res) {
  try {
    const body = req.body || {};
    const engine = await service.createEngine({
      companyId: req.authUser.company_id,
      engineCode: body.engine_code ?? body.engineCode,
      serialNumber: body.serial_number ?? body.serialNumber,
      engineModelId: body.engine_model_id ?? body.engineModelId,
      currentCycle: body.current_cycle ?? body.currentCycle,
      aircraftId: body.aircraft_id ?? body.aircraftId,
      newAircraft: body.new_aircraft ?? body.newAircraft,
    });
    return res.status(201).json({ success: true, data: engine });
  } catch (error) {
    return fail(res, error);
  }
}

async function updateEngine(req, res) {
  if (!isId(req.params.engineId)) {
    return res.status(400).json({ success: false, error: {
      code: "INVALID_ENGINE_ID", message: "Engine ID must be a positive BIGINT."
    } });
  }
  try {
    const body = req.body || {};
    const engine = await service.updateEngine({
      companyId: req.authUser.company_id,
      engineId: req.params.engineId,
      engineCode: body.engine_code ?? body.engineCode,
      serialNumber: body.serial_number ?? body.serialNumber,
      currentCycle: body.current_cycle ?? body.currentCycle,
    });
    return res.status(200).json({ success: true, data: engine });
  } catch (error) {
    return fail(res, error);
  }
}

module.exports = {
  listEngines,
  getEngineDetail,
  getSensorUploads,
  listEngineModels,
  listCompanyAircraft,
  createEngine,
  updateEngine,
};
