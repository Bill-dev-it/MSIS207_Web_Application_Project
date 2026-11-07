"use strict";

const reportsService = require("./reports.service");

async function getAdminReports(req, res) {
    try {
        const data = await reportsService.listAdminReports(req.query);
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code || "BAD_REQUEST",
                    message: error.message,
                },
            });
        }

        console.error("Failed to list admin reports:", error);
        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to load reviews and reports.",
            },
        });
    }
}

async function patchHideAdminReport(req, res) {
    try {
        const data = await reportsService.hideAdminReport(req.params.id);
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code || "BAD_REQUEST",
                    message: error.message,
                },
            });
        }

        console.error("Failed to hide admin report:", error);
        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to hide the review.",
            },
        });
    }
}

async function patchDismissAdminReport(req, res) {
    try {
        const data = await reportsService.dismissAdminReport(req.params.id);
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code || "BAD_REQUEST",
                    message: error.message,
                },
            });
        }

        console.error("Failed to dismiss admin report:", error);
        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to dismiss the report.",
            },
        });
    }
}

module.exports = {
    getAdminReports,
    patchHideAdminReport,
    patchDismissAdminReport,
};
