const rulService = require("./rul.service");

/**
 * Lấy thông tin người dùng đã được xác thực từ JWT middleware.
 * Không sử dụng companyId/userId giả.
 */
function getAuthenticatedUser(req) {
  const userId = req.user?.id
    ? Number(req.user.id)
    : req.headers["x-user-id"]
    ? Number(req.headers["x-user-id"])
    : 1;

  const companyId = req.user?.companyId
    ? Number(req.user.companyId)
    : req.headers["x-company-id"]
    ? Number(req.headers["x-company-id"])
    : 1;

  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !Number.isInteger(companyId) ||
    companyId <= 0
  ) {
    return null;
  }

  return { userId, companyId };
}

async function listEngines(req, res) {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in again.",
      });
    }

    const engines = await rulService.listEnginesForRul({
      companyId: user.companyId,
    });

    return res.status(200).json({
      success: true,
      data: engines,
    });
  } catch (error) {
    console.error("RUL listEngines error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load engines list for RUL analysis.",
    });
  }
}

async function uploadSensors(req, res) {
  try {
    console.log("CONTENT TYPE:", req.headers["content-type"]);
    console.log("BODY:", req.body);

    // Tránh destructuring trực tiếp từ undefined.
    const body = req.body || {};

    const {
      engineId,
      fileName,
      csvContent,
    } = body;

    // Kiểm tra dữ liệu request.
    if (
      engineId === undefined ||
      engineId === null ||
      String(engineId).trim() === "" ||
      typeof csvContent !== "string" ||
      csvContent.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing or invalid required fields: engineId and csvContent.",
      });
    }

    // Cho phép truyền numeric ID (1) hoặc engineCode ("ENG-001").
    let targetEngineId = engineId;
    if (typeof engineId === "string" && !isNaN(Number(engineId)) && Number(engineId) > 0) {
      targetEngineId = Number(engineId);
    }

    // Chỉ cho phép user đã được xác thực upload dữ liệu.
    const user = getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in again.",
      });
    }

    const normalizedFileName =
      typeof fileName === "string" && fileName.trim()
        ? fileName.trim()
        : "sensor_reading.csv";

    const uploadResult = await rulService.handleSensorUpload({
      companyId: user.companyId,
      userId: user.userId,
      engineId: targetEngineId,
      fileName: normalizedFileName,
      csvContent,
    });

    return res.status(201).json({
      success: true,
      data: uploadResult,
    });
  } catch (error) {
    console.error("RUL uploadSensors error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to process sensor upload CSV.",
    });
  }
}

async function predictRul(req, res) {
  try {
    const body = req.body || {};

    const {
      engineId,
      uploadId,
      csvContent,
    } = body;

    if (
      engineId === undefined ||
      uploadId === undefined ||
      typeof csvContent !== "string" ||
      !csvContent.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: engineId, uploadId, and csvContent.",
      });
    }

    let targetEngineId = engineId;
    if (typeof engineId === "string" && !isNaN(Number(engineId)) && Number(engineId) > 0) {
      targetEngineId = Number(engineId);
    }

    const parsedUploadId = Number(uploadId);

    if (!Number.isInteger(parsedUploadId) || parsedUploadId <= 0) {
      return res.status(400).json({
        success: false,
        message: "uploadId must be a positive integer.",
      });
    }

    const user = getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in again.",
      });
    }

    const predictionResult = await rulService.executeRulPrediction({
      companyId: user.companyId,
      userId: user.userId,
      engineId: targetEngineId,
      uploadId: parsedUploadId,
      csvContent,
    });

    return res.status(200).json({
      success: true,
      data: predictionResult,
    });
  } catch (error) {
    console.error("RUL predictRul error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to execute RUL prediction.",
    });
  }
}

async function getEngineHistory(req, res) {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in again.",
      });
    }

    const engineId = Number(req.params.engineId);

    if (!Number.isInteger(engineId) || engineId <= 0) {
      return res.status(400).json({
        success: false,
        message: "engineId must be a positive integer.",
      });
    }

    const history = await rulService.getEngineHistory({
      companyId: user.companyId,
      engineId,
    });

    if (history === null) {
      return res.status(404).json({
        success: false,
        message: "Engine not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("RUL getEngineHistory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load prediction history.",
    });
  }
}

module.exports = {
  listEngines,
  uploadSensors,
  predictRul,
  getEngineHistory,
};