const enginesRepository = require("./engines.repository");

async function listEngines({ companyId, search, urgency, page, limit }) {
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

