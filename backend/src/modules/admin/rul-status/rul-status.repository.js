"use strict";

const pool = require("../../../config/db");

/**
 * Fetch the active or most recent ML model version from `ml_model_versions`.
 */
async function findActiveModelVersion() {
    const result = await pool.query(`
        SELECT
            model_version_id::text AS model_version_id,
            model_name,
            version,
            dataset_subset,
            is_active,
            created_at
        FROM ml_model_versions
        ORDER BY is_active DESC, created_at DESC, model_version_id DESC
        LIMIT 1
    `);

    return result.rows[0] || null;
}

/**
 * Fetch aggregate RUL prediction KPIs from `rul_predictions`.
 */
async function findPredictionSummaryMetrics() {
    const result = await pool.query(`
        SELECT
            COUNT(*) FILTER (
                WHERE prediction_date >= CURRENT_DATE
            )::int AS predictions_today,
            COUNT(*)::int AS predictions_total,
            AVG(
                CASE
                    WHEN completed_at IS NOT NULL
                         AND completed_at > prediction_date
                    THEN EXTRACT(EPOCH FROM (completed_at - prediction_date))
                    ELSE NULL
                END
            ) AS avg_latency_seconds,
            COUNT(*) FILTER (
                WHERE status = 'FAILED'
                  AND prediction_date >= NOW() - INTERVAL '7 days'
            )::int AS failed_runs_7d,
            COUNT(*) FILTER (
                WHERE prediction_date >= NOW() - INTERVAL '7 days'
            )::int AS total_runs_7d,
            MAX(COALESCE(completed_at, prediction_date)) AS latest_activity_at
        FROM rul_predictions
    `);

    return result.rows[0] || {
        predictions_today: 0,
        predictions_total: 0,
        avg_latency_seconds: null,
        failed_runs_7d: 0,
        total_runs_7d: 0,
        latest_activity_at: null,
    };
}

/**
 * Fetch 14-day daily prediction volume from `rul_predictions`.
 */
async function findPredictionVolume14d() {
    const result = await pool.query(`
        WITH days AS (
            SELECT generate_series(
                CURRENT_DATE - INTERVAL '13 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            )::date AS day_date
        )
        SELECT
            TO_CHAR(d.day_date, 'YYYY-MM-DD') AS date,
            TO_CHAR(d.day_date, 'Mon DD') AS label,
            COUNT(rp.prediction_id)::int AS count,
            COUNT(rp.prediction_id) FILTER (
                WHERE rp.status = 'SUCCEEDED'
            )::int AS succeeded_count,
            COUNT(rp.prediction_id) FILTER (
                WHERE rp.status = 'FAILED'
            )::int AS failed_count
        FROM days d
        LEFT JOIN rul_predictions rp
            ON rp.prediction_date::date = d.day_date
        GROUP BY d.day_date
        ORDER BY d.day_date ASC
    `);

    return result.rows;
}

/**
 * Fetch urgency distribution for the latest succeeded prediction per engine.
 */
async function findUrgencyDistributionLatestPerEngine() {
    const result = await pool.query(`
        WITH latest_per_engine AS (
            SELECT DISTINCT ON (su.engine_id)
                su.engine_id,
                rp.urgency
            FROM rul_predictions rp
            INNER JOIN sensor_uploads su
                ON su.upload_id = rp.upload_id
            WHERE rp.status = 'SUCCEEDED'
              AND rp.urgency IS NOT NULL
            ORDER BY su.engine_id, rp.prediction_date DESC, rp.prediction_id DESC
        )
        SELECT
            COUNT(*) FILTER (WHERE urgency = 'NORMAL')::int AS normal,
            COUNT(*) FILTER (WHERE urgency = 'MONITOR')::int AS monitor,
            COUNT(*) FILTER (WHERE urgency = 'PREPARE')::int AS prepare,
            COUNT(*) FILTER (WHERE urgency = 'PRIORITIZE')::int AS prioritize
        FROM latest_per_engine
    `);

    const row = result.rows[0] || {};
    return {
        NORMAL: Number(row.normal) || 0,
        MONITOR: Number(row.monitor) || 0,
        PREPARE: Number(row.prepare) || 0,
        PRIORITIZE: Number(row.prioritize) || 0,
    };
}

/**
 * Fetch recent RUL predictions joined with `sensor_uploads`, `engines`, `aircraft`, and `companies`.
 */
async function findRecentPredictions(limit = 20) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const result = await pool.query(
        `
        SELECT
            rp.prediction_id::text AS prediction_id,
            rp.prediction_date,
            rp.completed_at,
            rp.status,
            rp.predicted_rul,
            rp.urgency,
            rp.error_message AS failure_reason,
            e.engine_id::text AS engine_id,
            e.engine_code,
            c.company_id::text AS company_id,
            c.company_name
        FROM rul_predictions rp
        INNER JOIN sensor_uploads su
            ON su.upload_id = rp.upload_id
        INNER JOIN engines e
            ON e.engine_id = su.engine_id
        INNER JOIN aircraft a
            ON a.aircraft_id = e.aircraft_id
        INNER JOIN companies c
            ON c.company_id = a.company_id
        ORDER BY rp.prediction_date DESC, rp.prediction_id DESC
        LIMIT $1
        `,
        [safeLimit]
    );

    return result.rows;
}

module.exports = {
    findActiveModelVersion,
    findPredictionSummaryMetrics,
    findPredictionVolume14d,
    findUrgencyDistributionLatestPerEngine,
    findRecentPredictions,
};
