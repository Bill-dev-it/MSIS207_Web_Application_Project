
const express = require("express");

const supplierController = require("./supplier.controller");

const { requireAuth } = require("../../../middleware/require-auth");
const requireAdmin = require("../../../middleware/require-admin");

const router = express.Router();

// All supplier moderation endpoints require an authenticated Admin.
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/v1/admin/suppliers
router.get("/", supplierController.getSuppliers);

// GET /api/v1/admin/suppliers/:supplierId
router.get("/:supplierId", supplierController.getSupplierById);

// PATCH /api/v1/admin/suppliers/:supplierId/status
router.patch(
    "/:supplierId/status",
    supplierController.changeSupplierStatus
);

module.exports = router;
