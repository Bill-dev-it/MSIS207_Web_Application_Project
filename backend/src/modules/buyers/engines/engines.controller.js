const enginesService = require("./engines.service");

async function listEngines(req, res) {
  try {
    const companyId = req.user?.companyId ? Number(req.user.companyId) : 1;
    const { search = "", urgency = "ALL", page = 1, limit = 10 } = req.query;

    const data = await enginesService.listEngines({
      companyId,
      search,
      urgency,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return res.status(200).json({
      success: true,
      data: data.engines,
      counts: data.counts,
      pagination: data.pagination,
    });
  } catch (error) {
    console.error("Engines listEngines error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve engines fleet.",
    });
  }
}

async function getEngineDetail(req, res) {
  try {
    const companyId = req.user?.companyId ? Number(req.user.companyId) : 1;
    const { engineId } = req.params;

    const engine = await enginesService.getEngineDetail({
      companyId,
      engineId: Number(engineId),
    });

    if (!engine) {
      return res.status(404).json({
        success: false,
        message: "Engine not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      data: engine,
    });
  } catch (error) {
    console.error("Engines getEngineDetail error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load engine details.",
    });
  }
}

async function getSensorUploads(req, res) {
  try {
    const companyId = req.user?.companyId ? Number(req.user.companyId) : 1;
    const { engineId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

    const uploads = await enginesService.getSensorUploads({
      companyId,
      engineId: Number(engineId),
      limit,
    });

    if (uploads === null) {
      return res.status(404).json({
        success: false,
        message: "Engine not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      data: uploads,
    });
  } catch (error) {
    console.error("Engines getSensorUploads error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load sensor upload history.",
    });
  }
}

module.exports = {
  listEngines,
  getEngineDetail,
  getSensorUploads,
};

