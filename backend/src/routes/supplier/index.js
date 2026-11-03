const router = require("express").Router();
const requireSupplier = require("../../middleware/require-supplier");

// All Supplier management endpoints stay closed until Login API integration.
router.use(requireSupplier);
router.use("/listings", require("./listings.routes"));
router.use("/inventory", require("./inventory.routes"));
router.use("/orders", require("./orders.routes"));
router.use("/overview", require("./overview.routes"));

module.exports = router;
