"use strict";

const rulStatusRepository = require("./rul-status.repository");

function formatDeployedLabel(dateValue) {
    if (!dateValue) return "Not deployed";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Not deployed";
    const formatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
    return `Deployed ${formatted}`;
}

function formatTimeHm(dateValue) {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
    });
}

function formatUrgencyLabel(urgency) {
    const normalized = String(urgency || "").toUpperCase();
    if (normalized === "NORMAL") return "Normal";
    if (normalized === "MONITOR") return "Monitor";
    if (normalized === "PREPARE") return "Prepare";
    if (normalized === "PRIORITIZE") return "Prioritize";
    return "—";
}

function formatResultLabel(status) {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "SUCCEEDED") return "OK";
    if (normalized === "FAILED") return "FAILED";
    if (normalized === "RUNNING") return "RUNNING";
    return normalized || "—";
}

async function probeInferenceServiceHealth() {
    const rawUrl = process.env.RUL_SERVICE_URL;
    const token = process.env.RUL_SERVICE_TOKEN;

    if (!rawUrl || !token) {
        return {
            reachable: false,
            latency_ms: null,
        };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const startMs = Date.now();

    try {
        const healthUrl = new URL("/health", rawUrl);
        const response = await fetch(healthUrl, {
            method: "GET",
            headers: {
                "X-RUL-Service-Token": token,
            },
            signal: controller.signal,
        });
        const elapsedMs = Date.now() - startMs;
        return {
            reachable: response.ok,
            latency_ms: response.ok ? elapsedMs : null,
        };
    } catch (_err) {
        return {
            reachable: false,
            latency_ms: null,
        };
    } finally {
        clearTimeout(timer);
    }
}

async function getAdminRulSystemStatus() {
    const [
        activeModel,
        summaryMetrics,
        volume14d,
        urgencyCounts,
        recentRows,
        healthProbe,
    ] = await Promise.all([
        rulStatusRepository.findActiveModelVersion(),
        rulStatusRepository.findPredictionSummaryMetrics(),
        rulStatusRepository.findPredictionVolume14d(),
        rulStatusRepository.findUrgencyDistributionLatestPerEngine(),
        rulStatusRepository.findRecentPredictions(20),
        probeInferenceServiceHealth(),
    ]);

    const checkedAt = new Date().toISOString();
    const hasActiveModel = Boolean(activeModel && activeModel.is_active);
    const serviceStatus = hasActiveModel ? "Operational" : "Degraded";

    const rawVersion = activeModel?.version || "1.0.0";
    const versionLabel = rawVersion.startsWith("v")
        ? rawVersion
        : `v${rawVersion}`;

    const predictionsTodayCount = Number(summaryMetrics.predictions_today) || 0;
    const predictionsTotalCount = Number(summaryMetrics.predictions_total) || 0;

    let avgLatencyLabel = "No latency delta recorded";
    let avgLatencySeconds = null;
    if (
        summaryMetrics.avg_latency_seconds !== null &&
        summaryMetrics.avg_latency_seconds !== undefined &&
        Number.isFinite(Number(summaryMetrics.avg_latency_seconds))
    ) {
        avgLatencySeconds = Number(
            Number(summaryMetrics.avg_latency_seconds).toFixed(2)
        );
        avgLatencyLabel = `Avg latency ${avgLatencySeconds}s`;
    } else if (healthProbe.latency_ms !== null) {
        avgLatencySeconds = Number((healthProbe.latency_ms / 1000).toFixed(2));
        avgLatencyLabel = `Avg latency ${avgLatencySeconds}s`;
    } else {
        avgLatencyLabel = `${predictionsTotalCount} total recorded`;
    }

    const failedRuns7d = Number(summaryMetrics.failed_runs_7d) || 0;
    const totalRuns7d = Number(summaryMetrics.total_runs_7d) || 0;
    const failureRatePercent =
        totalRuns7d > 0
            ? Number(((failedRuns7d / totalRuns7d) * 100).toFixed(1))
            : 0;

    const urgencyDistribution = [
        {
            urgency: "NORMAL",
            label: "Normal",
            count: urgencyCounts.NORMAL,
        },
        {
            urgency: "MONITOR",
            label: "Monitor",
            count: urgencyCounts.MONITOR,
        },
        {
            urgency: "PREPARE",
            label: "Prepare",
            count: urgencyCounts.PREPARE,
        },
        {
            urgency: "PRIORITIZE",
            label: "Prioritize",
            count: urgencyCounts.PRIORITIZE,
        },
    ];

    const recentPredictions = recentRows.map((row) => {
        const numericRul =
            row.predicted_rul !== null && row.predicted_rul !== undefined
                ? Math.round(Number(row.predicted_rul))
                : null;

        return {
            prediction_id: String(row.prediction_id),
            prediction_date: row.prediction_date,
            completed_at: row.completed_at,
            time: formatTimeHm(row.prediction_date),
            engine_id: String(row.engine_id),
            engine_code: row.engine_code,
            company_id: String(row.company_id),
            company_name: row.company_name,
            predicted_rul:
                row.predicted_rul !== null && row.predicted_rul !== undefined
                    ? Number(row.predicted_rul)
                    : null,
            rul_cycles: numericRul !== null ? `${numericRul} cyc` : "—",
            urgency: row.urgency || null,
            urgency_label: formatUrgencyLabel(row.urgency),
            status: row.status,
            result_label: formatResultLabel(row.status),
            failure_reason: row.failure_reason || null,
        };
    });

    return {
        service: {
            status: serviceStatus,
            last_check: "Last check just now",
            checked_at: checkedAt,
            live_inference_reachable: healthProbe.reachable,
        },
        model: {
            model_version_id: activeModel?.model_version_id || null,
            model_name: activeModel?.model_name || "rul-cmapss-v1",
            version: versionLabel,
            raw_version: rawVersion,
            dataset_subset: activeModel?.dataset_subset || "FD001",
            is_active: Boolean(activeModel?.is_active),
            deployed_at: activeModel?.created_at || null,
            deployed_label: formatDeployedLabel(activeModel?.created_at),
        },
        predictions_today: {
            count: predictionsTodayCount,
            total_predictions: predictionsTotalCount,
            avg_latency_seconds: avgLatencySeconds,
            subtitle: avgLatencyLabel,
        },
        failed_runs_7d: {
            count: failedRuns7d,
            total_runs_7d: totalRuns7d,
            failure_rate_percent: failureRatePercent,
            subtitle: `${failureRatePercent}% failure rate`,
        },
        prediction_volume_14d: volume14d,
        urgency_distribution: urgencyDistribution,
        recent_predictions: recentPredictions,
    };
}

module.exports = {
    getAdminRulSystemStatus,
};
