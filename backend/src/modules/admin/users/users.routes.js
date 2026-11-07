const express = require("express");

const usersController = require("./users.controller");
const { requireAuth } = require("../../../middleware/require-auth");
const requireAdmin = require("../../../middleware/require-admin");

const router = express.Router();

// All Admin Users endpoints require an authenticated ADMIN account.
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/v1/admin/users
router.get("/", usersController.getUsers);

// GET /api/v1/admin/users/:userId
router.get("/:userId", usersController.getUserById);

// PATCH /api/v1/admin/users/:userId/status
router.patch("/:userId/status", usersController.changeUserStatus);

module.exports = router;