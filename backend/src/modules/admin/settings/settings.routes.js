"use strict";

const express = require("express");
const requireAdmin = require("../../../middleware/require-admin");
const settingsController = require("./settings.controller");

const router = express.Router();

router.use(requireAdmin);

router.get("/", settingsController.getSystemSettings);
router.put("/", settingsController.putSystemSettings);

module.exports = router;

