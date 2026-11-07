"use strict";

const settingsRepository = require("./settings.repository");

const ALLOWED_CURRENCIES = new Set(["USD"]);
const ALLOWED_SHIPPING_ESTIMATES = new Set([
    "3-5 business days",
    "5-7 business days",
    "24-48 hours",
]);

function createError(statusCode, code, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

function parsePositiveInteger(value, fieldName) {
    if (typeof value === "boolean" || value === null || value === undefined || value === "") {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            `${fieldName} must be a positive integer.`
        );
    }
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0 || num > 10000) {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            `${fieldName} must be a positive integer between 1 and 10000.`
        );
    }
    return num;
}

function validateSettingsPayload(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            "Settings payload must be a valid JSON object."
        );
    }

    const currency = String(body.currency || "").trim().toUpperCase();
    if (!ALLOWED_CURRENCIES.has(currency)) {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            "Currency must be USD."
        );
    }

    const shippingEstimate = String(
        body.default_shipping_estimate || ""
    ).trim();
    if (!ALLOWED_SHIPPING_ESTIMATES.has(shippingEstimate)) {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            "Default shipping estimate must be one of: 3-5 business days, 5-7 business days, 24-48 hours."
        );
    }

    if (typeof body.supplier_approval_required !== "boolean") {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            "supplier_approval_required must be a boolean."
        );
    }

    if (typeof body.product_moderation !== "boolean") {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            "product_moderation must be a boolean."
        );
    }

    if (typeof body.demo_payment_mode !== "boolean") {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            "demo_payment_mode must be a boolean."
        );
    }

    const thresholds = body.rul_thresholds;
    if (!thresholds || typeof thresholds !== "object" || Array.isArray(thresholds)) {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            "rul_thresholds must be an object."
        );
    }

    const prioritize = parsePositiveInteger(
        thresholds.prioritize_at_or_below,
        "rul_thresholds.prioritize_at_or_below"
    );
    const prepare = parsePositiveInteger(
        thresholds.prepare_at_or_below,
        "rul_thresholds.prepare_at_or_below"
    );
    const monitor = parsePositiveInteger(
        thresholds.monitor_at_or_below,
        "rul_thresholds.monitor_at_or_below"
    );
    const normalAbove = parsePositiveInteger(
        thresholds.normal_above,
        "rul_thresholds.normal_above"
    );

    if (!(prioritize < prepare && prepare < monitor)) {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            "RUL thresholds must satisfy: Prioritize < Prepare < Monitor."
        );
    }

    if (normalAbove !== monitor) {
        throw createError(
            400,
            "INVALID_SETTINGS_PAYLOAD",
            "rul_thresholds.normal_above must match rul_thresholds.monitor_at_or_below."
        );
    }

    return {
        currency,
        default_shipping_estimate: shippingEstimate,
        supplier_approval_required: body.supplier_approval_required,
        product_moderation: body.product_moderation,
        rul_thresholds: {
            prioritize_at_or_below: prioritize,
            prepare_at_or_below: prepare,
            monitor_at_or_below: monitor,
            normal_above: normalAbove,
        },
        demo_payment_mode: body.demo_payment_mode,
    };
}

async function getAdminSystemSettings() {
    return settingsRepository.getSystemSettings();
}

async function updateAdminSystemSettings(payload) {
    const validated = validateSettingsPayload(payload);
    return settingsRepository.saveSystemSettings(validated);
}

module.exports = {
    getAdminSystemSettings,
    updateAdminSystemSettings,
};
