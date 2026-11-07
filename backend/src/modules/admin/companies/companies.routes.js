"use strict";

const express = require("express");
const companiesController = require("./companies.controller");
const { requireAuth } = require("../../../middleware/require-auth");
const requireAdmin = require("../../../middleware/require-admin");

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/", companiesController.getCompanies);
router.get("/:companyId", companiesController.getCompanyById);

module.exports = router;

