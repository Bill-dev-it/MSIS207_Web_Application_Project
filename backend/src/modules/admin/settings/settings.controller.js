"use strict";

const settingsService = require("./settings.service");

async function getSystemSettings(req, res) {
    try {
        const data = await settingsService.getAdminSystemSettings();
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Failed to fetch admin system settings:", error);
        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to load system settings.",
            },
        });
    }
}

async function putSystemSettings(req, res) {
    try {
        const data = await settingsService.updateAdminSystemSettings(req.body);
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

        console.error("Failed to update admin system settings:", error);
        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Unable to save system settings.",
            },
        });
    }
}

module.exports = {
    getSystemSettings,
    putSystemSettings,
};
