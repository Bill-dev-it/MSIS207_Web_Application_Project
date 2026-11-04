const express = require("express");
const rulController = require("./rul.controller");

const router = express.Router();

router.get("/engines", rulController.listEngines);
router.post("/upload", rulController.uploadSensors);
router.post("/predict", rulController.predictRul);
router.get("/engines/:engineId/history", rulController.getEngineHistory);

module.exports = router;

