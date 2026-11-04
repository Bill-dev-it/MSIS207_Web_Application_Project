const express = require("express");
const enginesController = require("./engines.controller");

const router = express.Router();

router.get("/", enginesController.listEngines);
router.get("/:engineId", enginesController.getEngineDetail);
router.get("/:engineId/sensor-uploads", enginesController.getSensorUploads);

module.exports = router;

