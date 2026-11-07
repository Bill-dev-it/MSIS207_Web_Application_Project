"use strict";

const express = require("express");
const requireAdmin = require("../../../middleware/require-admin");
const reportsController = require("./reports.controller");

const router = express.Router();

router.use(requireAdmin);

router.get("/", reportsController.getAdminReports);
router.patch("/:id/hide", reportsController.patchHideAdminReport);
router.patch("/:id/dismiss", reportsController.patchDismissAdminReport);

module.exports = router;

