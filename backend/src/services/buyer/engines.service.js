const enginesRepository = require("./engines.repository");

const URGENCIES = ["ALL", "PRIORITIZE", "PREPARE", "MONITOR", "NORMAL", "NOT_ANALYZED"];
const MAX_BIGINT = 9223372036854775807n;

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

async function createEngine({
  companyId,
  engineCode,
  serialNumber,
  engineModelId,
  currentCycle = 0,
  aircraftId,
  newAircraft,
}) {
  if (!isId(companyId)) {
    const error = new Error("Invalid buyer company identification.");
    error.statusCode = 401;
    error.code = "AUTH_REQUIRED";
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

  // Validate engineModelId
  if (!isId(engineModelId)) {
    const error = new Error("A valid engine model selection is required.");
    error.statusCode = 400;
    error.code = "INVALID_ENGINE_MODEL";
    throw error;
  }

  // Validate currentCycle
  const parsedCycle = parseCycle(currentCycle, 0);
  if (parsedCycle === null) {
    const error = new Error("Current cycle must be a non-negative integer.");
    error.statusCode = 400;
    error.code = "INVALID_CURRENT_CYCLE";
    throw error;
  }

  // Validate aircraft assignment: existing aircraftId OR newAircraft object
  let resolvedAircraftId = null;
  let resolvedNewAircraft = null;

  if (aircraftId !== undefined && aircraftId !== null && aircraftId !== "") {
    if (!isId(aircraftId)) {
      const error = new Error("Aircraft ID must be a positive integer.");
      error.statusCode = 400;
      error.code = "INVALID_AIRCRAFT_ID";
      throw error;
    }
    resolvedAircraftId = String(aircraftId);
  } else if (newAircraft && typeof newAircraft === "object") {
    const regNum = typeof (newAircraft.registration_number ?? newAircraft.registrationNumber) === "string"
      ? (newAircraft.registration_number ?? newAircraft.registrationNumber).trim()
      : "";
    if (!regNum) {
      const error = new Error("Aircraft registration (tail) number is required.");
      error.statusCode = 400;
      error.code = "INVALID_AIRCRAFT_REGISTRATION";
      throw error;
    }
    if (regNum.length > 50) {
      const error = new Error("Aircraft registration number must be 50 characters or fewer.");
      error.statusCode = 400;
      error.code = "INVALID_AIRCRAFT_REGISTRATION";
      throw error;
    }

    const mfr = typeof newAircraft.manufacturer === "string" ? newAircraft.manufacturer.trim() : "";
    if (!mfr) {
      const error = new Error("Aircraft manufacturer is required.");
      error.statusCode = 400;
      error.code = "INVALID_AIRCRAFT_MANUFACTURER";
      throw error;
    }
    if (mfr.length > 100) {
      const error = new Error("Aircraft manufacturer must be 100 characters or fewer.");
      error.statusCode = 400;
      error.code = "INVALID_AIRCRAFT_MANUFACTURER";
      throw error;
    }

    const mdl = typeof newAircraft.model === "string" ? newAircraft.model.trim() : "";
    if (!mdl) {
      const error = new Error("Aircraft model is required.");
      error.statusCode = 400;
      error.code = "INVALID_AIRCRAFT_MODEL";
      throw error;
    }
    if (mdl.length > 100) {
      const error = new Error("Aircraft model must be 100 characters or fewer.");
      error.statusCode = 400;
      error.code = "INVALID_AIRCRAFT_MODEL";
      throw error;
    }

    const aType = typeof (newAircraft.aircraft_type ?? newAircraft.aircraftType) === "string"
      ? (newAircraft.aircraft_type ?? newAircraft.aircraftType).trim()
      : "Commercial Fixed-Wing";
    if (aType.length > 100) {
      const error = new Error("Aircraft type must be 100 characters or fewer.");
      error.statusCode = 400;
      error.code = "INVALID_AIRCRAFT_TYPE";
      throw error;
    }

    let aYear = null;
    if (newAircraft.year !== undefined && newAircraft.year !== null && newAircraft.year !== "") {
      const parsedYear = Number(newAircraft.year);
      if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
        const error = new Error("Aircraft year must be an integer between 1900 and 2100.");
        error.statusCode = 400;
        error.code = "INVALID_AIRCRAFT_YEAR";
        throw error;
      }
      aYear = parsedYear;
    }

    const aStatus = typeof newAircraft.status === "string" && newAircraft.status.trim()
      ? newAircraft.status.trim()
      : "ACTIVE";
    if (aStatus.length > 20) {
      const error = new Error("Aircraft status must be 20 characters or fewer.");
      error.statusCode = 400;
      error.code = "INVALID_AIRCRAFT_STATUS";
      throw error;
    }

    resolvedNewAircraft = {
      registrationNumber: regNum,
      manufacturer: mfr,
      model: mdl,
      aircraftType: aType,
      year: aYear,
      status: aStatus,
    };
  } else {
    const error = new Error("Either an existing aircraftId or newAircraft details must be provided.");
    error.statusCode = 400;
    error.code = "AIRCRAFT_REQUIRED";
    throw error;
  }

  const createdId = await enginesRepository.createEngineWithAircraft({
    companyId,
    engineCode: trimmedCode,
    serialNumber: trimmedSerial,
    currentCycle: parsedCycle,
    engineModelId: String(engineModelId),
    aircraftId: resolvedAircraftId,
    newAircraft: resolvedNewAircraft,
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
