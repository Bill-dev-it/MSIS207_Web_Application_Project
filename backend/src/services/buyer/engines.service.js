const enginesRepository = require("./engines.repository");

const URGENCIES = ["ALL", "PRIORITIZE", "PREPARE", "MONITOR", "NORMAL", "NOT_ANALYZED"];

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

module.exports = {
  listEngines,
  getEngineDetail,
  getSensorUploads,
};
