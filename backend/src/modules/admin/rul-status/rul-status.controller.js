"use strict";

const rulStatusService = require("./rul-status.service");

async function getRulSystemStatus(req, res) {
    try {
        const data = await rulStatusService.getAdminRulSystemStatus();
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Failed to fetch admin RUL system status:", error);
        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to load RUL system status.",
            },
        });
    }
}

module.exports = {
    getRulSystemStatus,
};

