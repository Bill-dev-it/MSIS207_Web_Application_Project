"use strict";

const enginesRepository = require("./engines.repository");

const URGENCIES = ["ALL", "PRIORITIZE", "PREPARE", "MONITOR", "NORMAL", "NOT_ANALYZED"];
const MAX_BIGINT = 9223372036854775807n;

function createServiceError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function isId(value) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0;
  }
  return typeof value === "string" && /^[1-9]\d*$/.test(value) && BigInt(value) <= MAX_BIGINT;
}

function parseCycle(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") {
    if (Number.isSafeInteger(value) && value >= 0) return value;
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed) && BigInt(trimmed) <= MAX_BIGINT) {
      return Number(trimmed);
    }
    return null;
  }
  return null;
}

async function listEngines({ companyId, search, urgency, page, limit }) {
  if (!URGENCIES.includes(urgency)) {
    const error = new Error("Unsupported engine urgency filter.");
    error.statusCode = 400;
    error.code = "INVALID_URGENCY";
    throw error;
  }
  return await enginesRepository.getEngines({
    companyId,
    search,
    urgency,
    page,
    limit,
  });
}

async function getEngineDetail({ companyId, engineId }) {
  return await enginesRepository.getEngineById({ companyId, engineId });
}

async function getSensorUploads({ companyId, engineId, limit }) {
  return await enginesRepository.getEngineSensorUploads({
    companyId,
    engineId,
    limit,
  });
}

async function listEngineModels({ search = "", limit = 20 }) {
  if (typeof search !== "string") {
    const error = new Error("Search query must be text.");
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
  return await enginesRepository.searchEngineModels({ search, limit });
}

async function listCompanyAircraft({ companyId }) {
  if (!isId(companyId)) {
    const error = new Error("Invalid buyer company identification.");
    error.statusCode = 401;
    error.code = "AUTH_REQUIRED";
    throw error;
  }
  return await enginesRepository.getCompanyAircraft({ companyId });
}

function validateEngineFields({ engineCode, serialNumber, engineModelId, currentCycle }) {
  const trimmedCode = typeof engineCode === "string" ? engineCode.trim() : "";
  if (!trimmedCode) {
    throw createServiceError(400, "INVALID_ENGINE_CODE", "Engine code is required.");
  }
  if (trimmedCode.length > 80) {
    throw createServiceError(400, "INVALID_ENGINE_CODE", "Engine code must be 80 characters or fewer.");
  }

  const trimmedSerial = typeof serialNumber === "string" ? serialNumber.trim() : "";
  if (!trimmedSerial) {
    throw createServiceError(400, "INVALID_SERIAL_NUMBER", "Serial number is required.");
  }
  if (trimmedSerial.length > 100) {
    throw createServiceError(400, "INVALID_SERIAL_NUMBER", "Serial number must be 100 characters or fewer.");
  }

  if (!isId(engineModelId)) {
    throw createServiceError(400, "INVALID_ENGINE_MODEL", "A valid engine model selection is required.");
  }

  const parsedCycle = parseCycle(currentCycle, 0);
  if (parsedCycle === null) {
    throw createServiceError(400, "INVALID_CURRENT_CYCLE", "Current cycle must be a non-negative integer.");
  }

  return {
    engineCode: trimmedCode,
    serialNumber: trimmedSerial,
    engineModelId: String(engineModelId),
    currentCycle: parsedCycle,
  };
}

// A buyer can attach an engine to an existing aircraft or register a new aircraft.
// An existing aircraft ID takes precedence when both inputs are supplied.
function resolveAircraftInput({ aircraftId, newAircraft }) {
  if (aircraftId !== undefined && aircraftId !== null && aircraftId !== "") {
    if (!isId(aircraftId)) {
      throw createServiceError(400, "INVALID_AIRCRAFT_ID", "Aircraft ID must be a positive integer.");
    }
    return { aircraftId: String(aircraftId), newAircraft: null };
  }

  if (!newAircraft || typeof newAircraft !== "object") {
    throw createServiceError(
      400,
      "AIRCRAFT_REQUIRED",
      "Either an existing aircraftId or newAircraft details must be provided."
    );
  }

  const rawRegistration = newAircraft.registration_number ?? newAircraft.registrationNumber;
  const registrationNumber = typeof rawRegistration === "string" ? rawRegistration.trim() : "";
  if (!registrationNumber) {
    throw createServiceError(
      400,
      "INVALID_AIRCRAFT_REGISTRATION",
      "Aircraft registration (tail) number is required."
    );
  }
  if (registrationNumber.length > 50) {
    throw createServiceError(
      400,
      "INVALID_AIRCRAFT_REGISTRATION",
      "Aircraft registration number must be 50 characters or fewer."
    );
  }

  const manufacturer = typeof newAircraft.manufacturer === "string" ? newAircraft.manufacturer.trim() : "";
  if (!manufacturer) {
    throw createServiceError(400, "INVALID_AIRCRAFT_MANUFACTURER", "Aircraft manufacturer is required.");
  }
  if (manufacturer.length > 100) {
    throw createServiceError(
      400,
      "INVALID_AIRCRAFT_MANUFACTURER",
      "Aircraft manufacturer must be 100 characters or fewer."
    );
  }

  const model = typeof newAircraft.model === "string" ? newAircraft.model.trim() : "";
  if (!model) {
    throw createServiceError(400, "INVALID_AIRCRAFT_MODEL", "Aircraft model is required.");
  }
  if (model.length > 100) {
    throw createServiceError(400, "INVALID_AIRCRAFT_MODEL", "Aircraft model must be 100 characters or fewer.");
  }

  // Only non-string values fall back to the default type; empty strings stay trimmed.
  const rawType = newAircraft.aircraft_type ?? newAircraft.aircraftType;
  const aircraftType = typeof rawType === "string" ? rawType.trim() : "Commercial Fixed-Wing";
  if (aircraftType.length > 100) {
    throw createServiceError(400, "INVALID_AIRCRAFT_TYPE", "Aircraft type must be 100 characters or fewer.");
  }

  let year = null;
  if (newAircraft.year !== undefined && newAircraft.year !== null && newAircraft.year !== "") {
    const parsedYear = Number(newAircraft.year);
    if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
      throw createServiceError(
        400,
        "INVALID_AIRCRAFT_YEAR",
        "Aircraft year must be an integer between 1900 and 2100."
      );
    }
    year = parsedYear;
  }

  const status =
    typeof newAircraft.status === "string" && newAircraft.status.trim()
      ? newAircraft.status.trim()
      : "ACTIVE";
  if (status.length > 20) {
    throw createServiceError(400, "INVALID_AIRCRAFT_STATUS", "Aircraft status must be 20 characters or fewer.");
  }

  return {
    aircraftId: null,
    newAircraft: {
      registrationNumber,
      manufacturer,
      model,
      aircraftType,
      year,
      status,
    },
  };
}

async function createEngine({
  companyId,
  engineCode,
  serialNumber,
  engineModelId,
  currentCycle = 0,
  aircraftId,
  newAircraft,
}) {
  // Company identity comes strictly from the verified Buyer session.
  if (!isId(companyId)) {
    throw createServiceError(401, "AUTH_REQUIRED", "Invalid buyer company identification.");
  }

  // Validate all input before starting the repository registration operation.
  const validatedEngine = validateEngineFields({
    engineCode,
    serialNumber,
    engineModelId,
    currentCycle,
  });
  const aircraftAssignment = resolveAircraftInput({ aircraftId, newAircraft });

  const createdId = await enginesRepository.createEngineWithAircraft({
    companyId,
    engineCode: validatedEngine.engineCode,
    serialNumber: validatedEngine.serialNumber,
    currentCycle: validatedEngine.currentCycle,
    engineModelId: validatedEngine.engineModelId,
    aircraftId: aircraftAssignment.aircraftId,
    newAircraft: aircraftAssignment.newAircraft,
  });

  return await enginesRepository.getEngineById({ companyId, engineId: createdId });
}

async function updateEngine({ companyId, engineId, engineCode, serialNumber, currentCycle }) {
  if (!isId(companyId)) {
    const error = new Error("Invalid buyer company identification.");
    error.statusCode = 401;
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  if (!isId(engineId)) {
    const error = new Error("Engine ID must be a positive integer.");
    error.statusCode = 400;
    error.code = "INVALID_ENGINE_ID";
    throw error;
  }

  // Validate engineCode
  const trimmedCode = typeof engineCode === "string" ? engineCode.trim() : "";
  if (!trimmedCode) {
    const error = new Error("Engine code is required.");
    error.statusCode = 400;
    error.code = "INVALID_ENGINE_CODE";
    throw error;
  }
  if (trimmedCode.length > 80) {
    const error = new Error("Engine code must be 80 characters or fewer.");
    error.statusCode = 400;
    error.code = "INVALID_ENGINE_CODE";
    throw error;
  }

  // Validate serialNumber
  const trimmedSerial = typeof serialNumber === "string" ? serialNumber.trim() : "";
  if (!trimmedSerial) {
    const error = new Error("Serial number is required.");
    error.statusCode = 400;
    error.code = "INVALID_SERIAL_NUMBER";
    throw error;
  }
  if (trimmedSerial.length > 100) {
    const error = new Error("Serial number must be 100 characters or fewer.");
    error.statusCode = 400;
    error.code = "INVALID_SERIAL_NUMBER";
    throw error;
  }

  // Validate currentCycle
  const parsedCycle = parseCycle(currentCycle, null);
  if (parsedCycle === null) {
    const error = new Error("Current cycle must be a non-negative integer.");
    error.statusCode = 400;
    error.code = "INVALID_CURRENT_CYCLE";
    throw error;
  }

  await enginesRepository.updateEngine({
    companyId,
    engineId: String(engineId),
    engineCode: trimmedCode,
    serialNumber: trimmedSerial,
    currentCycle: parsedCycle,
  });

  return await enginesRepository.getEngineById({ companyId, engineId: String(engineId) });
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
