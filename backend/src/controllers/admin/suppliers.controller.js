"use strict";

const service = require("../../services/admin/suppliers.service");

function fail(res, error) {
  const status = error.statusCode || 500;
  if (status >= 500) {
    console.error("Admin suppliers request failed:", error);
  }
  return res.status(status).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message:
        status >= 500
          ? "Unable to retrieve supplier records."
          : error.message,
    },
  });
}

async function listSuppliers(req, res) {
  try {
    for (const key of ["status", "page", "limit", "search"]) {
      if (req.query?.[key] !== undefined && typeof req.query[key] !== "string") {
        const error = new Error(
          `Query parameter "${key}" must be a single text value.`
        );
        error.statusCode = 400;
        error.code = "INVALID_QUERY";
        throw error;
      }
    }

    const result = await service.listSuppliers({
      status: req.query?.status ?? "PENDING",
      page: req.query?.page ?? "1",
      limit: req.query?.limit ?? "10",
      search: req.query?.search ?? "",
    });

    const { suppliers, ...meta } = result;
    return res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers,
      meta,
    });
  } catch (error) {
    return fail(res, error);
  }
}

async function approveSupplier(req, res) {
  try {
    const data = await service.approveSupplier(req.params.supplierId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}

module.exports = { listSuppliers, approveSupplier };
