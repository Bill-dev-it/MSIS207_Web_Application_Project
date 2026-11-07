"use strict";

const fs = require("fs");
const path = require("path");
const pool = require("../../../config/db");

const SETTINGS_FILE_PATH = path.join(
    __dirname,
    "../../../../storage/admin-system-settings.json"
);

const DEFAULT_THRESHOLDS = {
    prioritize_at_or_below: 20,
    prepare_at_or_below: 40,
    monitor_at_or_below: 80,
    normal_above: 80,
};

/**
 * Query PostgreSQL `rul_predictions.decision_rule_snapshot` to read the
 * baseline RUL thresholds recorded in the database.
 */
async function readDatabaseBaselineThresholds() {
    try {
        const result = await pool.query(`
            SELECT decision_rule_snapshot
            FROM rul_predictions
            WHERE decision_rule_snapshot IS NOT NULL
            ORDER BY prediction_date DESC, prediction_id DESC
            LIMIT 1
        `);

        const snapshot = result.rows[0]?.decision_rule_snapshot;
        if (!snapshot || typeof snapshot !== "object") {
            return { ...DEFAULT_THRESHOLDS };
        }

        const prioritize = Number(snapshot.prioritize_max);
        const prepare = Number(snapshot.prepare_max);
        const monitor = Number(snapshot.monitor_max);

        if (
            Number.isInteger(prioritize) &&
            Number.isInteger(prepare) &&
            Number.isInteger(monitor) &&
            prioritize > 0 &&
            prioritize < prepare &&
            prepare < monitor
        ) {
            return {
                prioritize_at_or_below: prioritize,
                prepare_at_or_below: prepare,
                monitor_at_or_below: monitor,
                normal_above: monitor,
            };
        }

        return { ...DEFAULT_THRESHOLDS };
    } catch (_err) {
        return { ...DEFAULT_THRESHOLDS };
    }
}

async function getBaselineSettings() {
    const thresholds = await readDatabaseBaselineThresholds();

    return {
        currency: "USD",
        default_shipping_estimate: "3-5 business days",
        supplier_approval_required: true,
        product_moderation: false,
        rul_thresholds: thresholds,
        demo_payment_mode: true,
        updated_at: null,
    };
}

async function getSystemSettings() {
    const baseline = await getBaselineSettings();

    try {
        if (!fs.existsSync(SETTINGS_FILE_PATH)) {
            return baseline;
        }
        const raw = fs.readFileSync(SETTINGS_FILE_PATH, "utf8");
        const stored = JSON.parse(raw);
        if (!stored || typeof stored !== "object") {
            return baseline;
        }

        return {
            currency: stored.currency || baseline.currency,
            default_shipping_estimate:
                stored.default_shipping_estimate ||
                baseline.default_shipping_estimate,
            supplier_approval_required:
                typeof stored.supplier_approval_required === "boolean"
                    ? stored.supplier_approval_required
                    : baseline.supplier_approval_required,
            product_moderation:
                typeof stored.product_moderation === "boolean"
                    ? stored.product_moderation
                    : baseline.product_moderation,
            rul_thresholds: {
                prioritize_at_or_below:
                    Number(stored.rul_thresholds?.prioritize_at_or_below) ||
                    baseline.rul_thresholds.prioritize_at_or_below,
                prepare_at_or_below:
                    Number(stored.rul_thresholds?.prepare_at_or_below) ||
                    baseline.rul_thresholds.prepare_at_or_below,
                monitor_at_or_below:
                    Number(stored.rul_thresholds?.monitor_at_or_below) ||
                    baseline.rul_thresholds.monitor_at_or_below,
                normal_above:
                    Number(stored.rul_thresholds?.normal_above) ||
                    baseline.rul_thresholds.normal_above,
            },
            demo_payment_mode:
                typeof stored.demo_payment_mode === "boolean"
                    ? stored.demo_payment_mode
                    : baseline.demo_payment_mode,
            updated_at: stored.updated_at || null,
        };
    } catch (_err) {
        return baseline;
    }
}

async function saveSystemSettings(nextSettings) {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const record = {
        currency: nextSettings.currency,
        default_shipping_estimate: nextSettings.default_shipping_estimate,
        supplier_approval_required: nextSettings.supplier_approval_required,
        product_moderation: nextSettings.product_moderation,
        rul_thresholds: {
            prioritize_at_or_below:
                nextSettings.rul_thresholds.prioritize_at_or_below,
            prepare_at_or_below:
                nextSettings.rul_thresholds.prepare_at_or_below,
            monitor_at_or_below:
                nextSettings.rul_thresholds.monitor_at_or_below,
            normal_above: nextSettings.rul_thresholds.normal_above,
        },
        demo_payment_mode: nextSettings.demo_payment_mode,
        updated_at: new Date().toISOString(),
    };

    fs.writeFileSync(
        SETTINGS_FILE_PATH,
        JSON.stringify(record, null, 2),
        "utf8"
    );

    return record;
}

module.exports = {
    getSystemSettings,
    saveSystemSettings,
};
