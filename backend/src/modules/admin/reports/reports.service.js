"use strict";

const reportsRepository = require("./reports.repository");

const ALLOWED_STATUSES = new Set(["ALL", "OPEN", "RESOLVED"]);

function createError(statusCode, code, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

function validateReportId(reportId) {
    const normalized = String(reportId ?? "").trim();
    if (!/^[1-9]\d*$/.test(normalized)) {
        throw createError(
            400,
            "INVALID_REPORT_ID",
            "Report ID must be a positive integer."
        );
    }
    return normalized;
}

async function listAdminReports(query = {}) {
    const normalizedStatus = query.status
        ? String(query.status).trim().toUpperCase()
        : "ALL";

    if (!ALLOWED_STATUSES.has(normalizedStatus)) {
        throw createError(
            400,
            "INVALID_STATUS_FILTER",
            "Invalid status filter. Allowed values: ALL, OPEN, RESOLVED."
        );
    }

    return reportsRepository.findReports({
        status: normalizedStatus,
    });
}

async function hideAdminReport(reportId) {
    const validId = validateReportId(reportId);
    const updated = await reportsRepository.hideReportById(validId);

    if (!updated) {
        throw createError(
            404,
            "REPORT_NOT_FOUND",
            "The requested review or report was not found."
        );
    }

    return updated;
}

async function dismissAdminReport(reportId) {
    const validId = validateReportId(reportId);
    const updated = await reportsRepository.dismissReportById(validId);

    if (!updated) {
        throw createError(
            404,
            "REPORT_NOT_FOUND",
            "The requested review or report was not found."
        );
    }

    return updated;
}

module.exports = {
    listAdminReports,
    hideAdminReport,
    dismissAdminReport,
};

