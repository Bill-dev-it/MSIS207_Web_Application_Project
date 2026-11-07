"use strict";

const express = require("express");
const requireAdmin = require("../../../middleware/require-admin");
const rulStatusController = require("./rul-status.controller");

const router = express.Router();

router.use(requireAdmin);

router.get("/", rulStatusController.getRulSystemStatus);

module.exports = router;

