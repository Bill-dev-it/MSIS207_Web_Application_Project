const express = require("express");
const enginesController = require("../../controllers/buyer/engines.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/engines List buyer company engines
 * @apiName GetBuyerEngines
 * @apiGroup Buyer Engines
 * @apiVersion 1.0.0
 * @apiDescription Lists engines owned by the authenticated Buyer company, with previously stored successful predictions only.
 * @apiPermission Buyer
 * @apiQuery {String} [search] Search engine code, model, aircraft tail or serial number.
 * @apiQuery {String="ALL","PRIORITIZE","PREPARE","MONITOR","NORMAL","NOT_ANALYZED"} [urgency=ALL] Filter stored prediction urgency.
 * @apiQuery {Number} [page=1] Positive page number.
 * @apiQuery {Number} [limit=10] Page size from 1 to 100.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Company-owned engines.
 * @apiSuccess {Object} meta Counts and pagination.
 * @apiError (400 Bad Request) INVALID_QUERY, INVALID_SEARCH, INVALID_URGENCY Invalid query values.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Engine list could not be retrieved.
 * @apiSuccessExample {json} 200 OK:
 *     { "success": true, "data": [], "meta": { "counts": { "ALL": 0 }, "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 1 } } }
 */
router.get("/", enginesController.listEngines);

/**
 * @api {get} /api/v1/engines/models Search engine model catalog
 * @apiName GetBuyerEngineModels
 * @apiGroup Buyer Engines
 * @apiVersion 1.0.0
 * @apiDescription Searches available engine models from the catalog by model name, manufacturer, or family.
 * @apiPermission Buyer
 * @apiQuery {String} [search] Search text.
 * @apiQuery {Number} [limit=20] Max results (1 to 50).
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Engine model records.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 */
router.get("/models", enginesController.listEngineModels);

/**
 * @api {get} /api/v1/engines/aircraft List buyer company aircraft
 * @apiName GetBuyerCompanyAircraft
 * @apiGroup Buyer Engines
 * @apiVersion 1.0.0
 * @apiDescription Lists all aircraft belonging to the authenticated Buyer company.
 * @apiPermission Buyer
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Aircraft records.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 */
router.get("/aircraft", enginesController.listCompanyAircraft);

/**
 * @api {post} /api/v1/engines Register a new engine
 * @apiName CreateBuyerEngine
 * @apiGroup Buyer Engines
 * @apiVersion 1.0.0
 * @apiDescription Registers a new company engine, assigning it to an existing company aircraft or creating a new aircraft inline within a transaction.
 * @apiPermission Buyer
 * @apiHeader {String} X-AeroRUL-Request 1
 * @apiBody {String} engine_code Unique engine identifier for the aircraft.
 * @apiBody {String} serial_number Unique serial number for the engine model.
 * @apiBody {String|Number} engine_model_id Valid engine model ID from the catalog.
 * @apiBody {Number} [current_cycle=0] Current flight/operating cycles.
 * @apiBody {String|Number} [aircraft_id] Existing company aircraft ID.
 * @apiBody {Object} [new_aircraft] New aircraft details if aircraft_id is not provided.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Registered engine detail.
 * @apiError (400 Bad Request) INVALID_ENGINE_CODE, INVALID_SERIAL_NUMBER, INVALID_ENGINE_MODEL, AIRCRAFT_REQUIRED Validation failure.
 * @apiError (404 Not Found) AIRCRAFT_NOT_FOUND Aircraft not found for this company.
 * @apiError (409 Conflict) DUPLICATE_ENGINE_CODE, DUPLICATE_SERIAL_NUMBER, DUPLICATE_REGISTRATION_NUMBER Uniqueness conflict.
 */
router.post("/", enginesController.createEngine);

/**
 * @api {get} /api/v1/engines/:engineId Get buyer engine detail
 * @apiName GetBuyerEngineDetail
 * @apiGroup Buyer Engines
 * @apiVersion 1.0.0
 * @apiDescription Returns engine and latest stored successful prediction only when the engine belongs to the authenticated Buyer company. Does not run inference.
 * @apiPermission Buyer
 * @apiParam {String} engineId Positive BIGINT engine ID.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Engine, aircraft and optional stored prediction.
 * @apiError (404 Not Found) ENGINE_NOT_FOUND Engine not found for this company.
 * @apiError (400 Bad Request) INVALID_ENGINE_ID Engine ID is not a positive BIGINT.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Engine detail could not be retrieved.
 */
router.get("/:engineId", enginesController.getEngineDetail);

/**
 * @api {put} /api/v1/engines/:engineId Update engine details
 * @apiName UpdateBuyerEngine
 * @apiGroup Buyer Engines
 * @apiVersion 1.0.0
 * @apiDescription Updates editable engine details (engine_code, serial_number, current_cycle) for a company-owned engine.
 * @apiPermission Buyer
 * @apiHeader {String} X-AeroRUL-Request 1
 * @apiParam {String} engineId Positive BIGINT engine ID.
 * @apiBody {String} engine_code Updated engine identifier.
 * @apiBody {String} serial_number Updated serial number.
 * @apiBody {Number} current_cycle Updated flight/operating cycles.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Updated engine detail.
 * @apiError (400 Bad Request) INVALID_ENGINE_ID, INVALID_ENGINE_CODE, INVALID_SERIAL_NUMBER, INVALID_CURRENT_CYCLE Validation failure.
 * @apiError (404 Not Found) ENGINE_NOT_FOUND Engine not found for this company.
 * @apiError (409 Conflict) DUPLICATE_ENGINE_CODE, DUPLICATE_SERIAL_NUMBER Uniqueness conflict.
 */
router.put("/:engineId", enginesController.updateEngine);

/**
 * @api {get} /api/v1/engines/:engineId/sensor-uploads List engine sensor uploads
 * @apiName GetBuyerEngineSensorUploads
 * @apiGroup Buyer Engines
 * @apiVersion 1.0.0
 * @apiDescription Lists sensor uploads only when the engine belongs to the authenticated Buyer company.
 * @apiPermission Buyer
 * @apiParam {String} engineId Positive BIGINT engine ID.
 * @apiQuery {Number} [limit=10] Result limit from 1 to 100.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Sensor upload records.
 * @apiError (404 Not Found) ENGINE_NOT_FOUND Engine not found for this company.
 * @apiError (400 Bad Request) INVALID_ENGINE_ID, INVALID_QUERY Invalid engine ID or limit.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Upload metadata could not be retrieved.
 */
router.get("/:engineId/sensor-uploads", enginesController.getSensorUploads);

module.exports = router;
