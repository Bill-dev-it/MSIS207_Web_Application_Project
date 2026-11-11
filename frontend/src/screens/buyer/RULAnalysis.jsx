import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../../features/buyer/cart";
import { EngineUrgencyBadge } from "../../features/buyer/engines/components/EngineUrgencyBadge";
import { getEngines } from "../../features/buyer/engines/services/engineApi";
import {
  generateReplacementRecommendations,
  getReplacementRecommendations,
  getRulHistory,
  predictRul,
} from "../../features/buyer/rul-analysis/services/rulApi";
import { downloadSampleCsv } from "../../features/buyer/rul-analysis/sampleCsv";

const STATUS_LABEL = {
  PRIORITIZE: "Prioritize",
  PREPARE: "Prepare",
  MONITOR: "Monitor",
  NORMAL: "Normal",
};

const SOURCE_LABEL = {
  NASA_CMAPSS_FD002: "Standard reference benchmark sample",
  CUSTOM_SYNTHETIC: "Custom synthetic telemetry",
  EXTERNAL_MAPPED: "Externally sourced, mapped telemetry",
  LEGACY_UNCLASSIFIED: "Legacy upload (source not recorded)",
};

const URGENCY_GUIDANCE = {
  PRIORITIZE: {
    heading: "High Priority Replacement Planning",
    description:
      "Low estimated RUL indicates high priority for scheduled maintenance, overhaul, or engine replacement.",
    sectionHeading: "Replacement Options",
    statusSummary: "Critical condition (≤ 20 cycles)",
    isProminent: true,
    containerClass:
      "rounded-xl border border-red-300 border-l-4 border-l-red-600 bg-red-50/70 p-4 sm:p-5 text-primary-900",
    statusTextClass: "text-red-900",
  },
  PREPARE: {
    heading: "Prepare Replacement Options",
    description:
      "Estimated RUL suggests planning for replacement or overhaul in upcoming maintenance cycles.",
    sectionHeading: "Replacement Options",
    statusSummary: "Advance planning (21–40 cycles)",
    isProminent: true,
    containerClass:
      "rounded-xl border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50/70 p-4 sm:p-5 text-primary-900",
    statusTextClass: "text-amber-900",
  },
  MONITOR: {
    heading: "Routine Monitoring",
    description:
      "Operating parameters indicate moderate cycle life remaining. Continue routine health monitoring.",
    sectionHeading: "Replacement Options",
    statusSummary: "Routine monitoring (41–80 cycles)",
    isProminent: false,
    containerClass:
      "rounded-xl border border-slate-200 border-l-4 border-l-sky-500 bg-slate-50 p-4 sm:p-5 text-primary-800",
    statusTextClass: "text-slate-700",
  },
  NORMAL: {
    heading: "Replacement Planning",
    description:
      "Your engine is currently classified as Normal. No immediate replacement priority is indicated.",
    sectionHeading: "Replacement Options",
    statusSummary: "Normal (> 80 cycles)",
    isProminent: false,
    containerClass:
      "rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 text-primary-800",
    statusTextClass: "text-slate-700",
  },
};

const FALLBACK_GUIDANCE = {
  heading: "Replacement Planning",
  description:
    "Review saved replacement options associated with this RUL prediction.",
  sectionHeading: "Replacement Options",
  statusSummary: "Saved prediction",
  isProminent: false,
  containerClass:
    "rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 text-primary-800",
  statusTextClass: "text-slate-700",
};

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatRecommendationStatus(status) {
  switch (status) {
    case "NO_MATCH":
      return "No matching listings";
    case "READY":
    case "SUCCEEDED":
      return "Options available";
    case "FAILED":
      return "Unavailable";
    case "NOT_RUN":
      return "Not generated";
    default:
      return status ? String(status) : "Not generated";
  }
}

function buildPredictionContext(record) {
  if (!record || record.prediction_id == null) return null;
  return {
    prediction_id: String(record.prediction_id),
    urgency: record.urgency || "",
    predicted_rul: record.predicted_rul,
    cycle_at_prediction: record.cycle_at_prediction,
    prediction_date: record.prediction_date || record.completed_at || null,
    original_file_name: record.original_file_name || "",
    source_classification: record.source_classification || "",
  };
}

export default function RULAnalysis() {
  const { addItem } = useCart();
  const [params, setParams] = useSearchParams();
  const engineId = params.get("engineId") || "";
  const [engines, setEngines] = useState([]);
  const [loadingEngines, setLoadingEngines] = useState(true);
  const [file, setFile] = useState(null);
  const [sourceClassification, setSourceClassification] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [recommendationData, setRecommendationData] = useState(null);
  const [recommendationPredictionId, setRecommendationPredictionId] = useState("");
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [addingListingId, setAddingListingId] = useState("");
  const [cartStatus, setCartStatus] = useState({ listingId: "", type: "", message: "" });
  const [showSpecDetails, setShowSpecDetails] = useState(false);
  const requestKeyRef = useRef("");
  const recommendationRequestRef = useRef(0);

  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        setLoadingEngines(true);
        const firstPage = await getEngines({ page: 1, limit: 100, signal: abort.signal });
        const availableEngines = Array.isArray(firstPage?.data) ? firstPage.data : [];
        const totalPages = Number(firstPage?.pagination?.totalPages) || 1;
        for (let page = 2; page <= totalPages && !abort.signal.aborted; page += 1) {
          const nextPage = await getEngines({ page, limit: 100, signal: abort.signal });
          if (Array.isArray(nextPage?.data)) availableEngines.push(...nextPage.data);
        }
        if (!abort.signal.aborted) setEngines(availableEngines);
      } catch (e) {
        if (!abort.signal.aborted) setError(e.message || "Could not load engines.");
      } finally {
        if (!abort.signal.aborted) setLoadingEngines(false);
      }
    }
    load();
    return () => abort.abort();
  }, []);

  useEffect(() => {
    if (!engineId) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }
    const abort = new AbortController();
    setHistory([]);
    setLoadingHistory(true);

    async function loadHistory() {
      try {
        const rows = await getRulHistory(engineId, { signal: abort.signal });
        if (!abort.signal.aborted) {
          setHistory(Array.isArray(rows) ? rows : []);
        }
      } catch (e) {
        if (!abort.signal.aborted) {
          setError(e.message || "Cannot load prediction history.");
        }
      } finally {
        if (!abort.signal.aborted) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();
    return () => abort.abort();
  }, [engineId]);

  function resetPredictionView() {
    recommendationRequestRef.current += 1;
    setResult(null);
    setError("");
    requestKeyRef.current = "";
    setRecommendationData(null);
    setRecommendationPredictionId("");
    setSelectedPrediction(null);
    setLoadingRecommendations(false);
    setRecommendationError("");
    setAddingListingId("");
    setCartStatus({ listingId: "", type: "", message: "" });
  }

  function onEngineChange(event) {
    const next = event.target.value;
    setParams(next ? { engineId: next } : {});
    setFile(null);
    resetPredictionView();
  }

  function onFileChange(event) {
    const selected = event.target.files?.[0] || null;
    resetPredictionView();
    if (selected) {
      if (!selected.name.toLowerCase().endsWith(".csv")) {
        setError("Invalid file type: Please upload a file with a .csv extension.");
        setFile(null);
        return;
      }
      if (selected.size > 1024 * 1024) {
        setError("File too large: CSV must be 1 MiB or smaller.");
        setFile(null);
        return;
      }
      if (selected.size === 0) {
        setError("Invalid file: Selected CSV file is empty.");
        setFile(null);
        return;
      }
    }
    setFile(selected);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!engineId || !file || busy) return;
    recommendationRequestRef.current += 1;
    const currentRecReq = recommendationRequestRef.current;
    setBusy(true);
    setError("");
    setResult(null);
    setRecommendationData(null);
    setRecommendationPredictionId("");
    setSelectedPrediction(null);
    setRecommendationError("");
    setCartStatus({ listingId: "", type: "", message: "" });
    let prediction;
    try {
      if (!requestKeyRef.current) {
        if (!globalThis.crypto?.randomUUID) throw new Error("Secure request IDs are unavailable in this browser.");
        requestKeyRef.current = globalThis.crypto.randomUUID();
      }
      prediction = await predictRul({
        engineId, file, requestKey: requestKeyRef.current, sourceClassification,
      });
      const targetPredictionId = String(prediction.prediction_id);
      setResult(prediction);
      setSelectedPrediction(buildPredictionContext(prediction));
      setRecommendationPredictionId(targetPredictionId);
    } catch (e) {
      setError(e.message || "RUL inference unavailable.");
      setBusy(false);
      return;
    }
    setBusy(false);

    setLoadingRecommendations(true);
    try {
      const generated = await generateReplacementRecommendations(prediction.prediction_id);
      if (currentRecReq === recommendationRequestRef.current) {
        setRecommendationData(generated);
      }
    } catch (e) {
      if (currentRecReq === recommendationRequestRef.current) {
        setRecommendationError(e.message || "Recommendations could not be generated.");
      }
    } finally {
      if (currentRecReq === recommendationRequestRef.current) {
        setLoadingRecommendations(false);
      }
    }
    try {
      setHistory(await getRulHistory(engineId));
    } catch (e) {
      setError(e.message || "The prediction was saved, but history could not be refreshed.");
    }
  }

  async function loadSavedRecommendations(predictionRecordOrId) {
    const record =
      typeof predictionRecordOrId === "object" && predictionRecordOrId !== null
        ? predictionRecordOrId
        : history.find(item => String(item.prediction_id) === String(predictionRecordOrId)) ||
          (String(result?.prediction_id || "") === String(predictionRecordOrId) ? result : null);
    const targetPredictionId = String(
      record ? record.prediction_id : predictionRecordOrId
    );
    recommendationRequestRef.current += 1;
    const currentRecReq = recommendationRequestRef.current;

    if (String(result?.prediction_id || "") !== targetPredictionId) {
      setResult(null);
    }
    setSelectedPrediction(
      record
        ? buildPredictionContext(record)
        : { prediction_id: targetPredictionId, urgency: "", predicted_rul: null }
    );
    setRecommendationPredictionId(targetPredictionId);
    setRecommendationData(null);
    setRecommendationError("");
    setCartStatus({ listingId: "", type: "", message: "" });
    setLoadingRecommendations(true);
    try {
      const saved = await getReplacementRecommendations(targetPredictionId);
      if (currentRecReq === recommendationRequestRef.current) {
        setRecommendationData(saved);
      }
    } catch (e) {
      if (currentRecReq === recommendationRequestRef.current) {
        setRecommendationError(e.message || "Saved recommendations could not be loaded.");
      }
    } finally {
      if (currentRecReq === recommendationRequestRef.current) {
        setLoadingRecommendations(false);
      }
    }
  }

  async function retryRecommendations() {
    if (!recommendationPredictionId || loadingRecommendations) return;
    const targetPredictionId = String(recommendationPredictionId);
    recommendationRequestRef.current += 1;
    const currentRecReq = recommendationRequestRef.current;
    setLoadingRecommendations(true);
    setRecommendationError("");
    try {
      const generated = await generateReplacementRecommendations(targetPredictionId);
      if (currentRecReq === recommendationRequestRef.current) {
        setRecommendationData(generated);
        setHistory(prev =>
          prev.map(item =>
            String(item.prediction_id) === targetPredictionId
              ? { ...item, recommendation_status: generated.recommendation_status }
              : item
          )
        );
      }
    } catch (e) {
      if (currentRecReq === recommendationRequestRef.current) {
        setRecommendationError(e.message || "Recommendations could not be generated.");
      }
    } finally {
      if (currentRecReq === recommendationRequestRef.current) {
        setLoadingRecommendations(false);
      }
    }
  }

  async function addRecommendationToCart(recommendation) {
    if (!recommendation?.listing_id || addingListingId) return;
    const targetListingId = String(recommendation.listing_id);
    setAddingListingId(targetListingId);
    setCartStatus({ listingId: targetListingId, type: "", message: "" });
    try {
      await addItem(recommendation.listing_id, 1);
      setCartStatus({
        listingId: targetListingId,
        type: "success",
        message: `${recommendation.product_name} added to cart.`,
      });
    } catch (e) {
      setCartStatus({
        listingId: targetListingId,
        type: "error",
        message: e.message || "Could not add this listing to your cart.",
      });
    } finally {
      setAddingListingId("");
    }
  }

  const selectedEngine = engines.find(e => String(e.engineId) === String(engineId));
  const engineDisplayName = selectedEngine
    ? (selectedEngine.engineCode || selectedEngine.serialNumber || `Engine #${selectedEngine.engineId}`)
    : (engineId ? `Engine #${engineId}` : "");

  const activePrediction =
    (result && String(result.prediction_id) === String(recommendationPredictionId)
      ? result
      : null) ||
    (selectedPrediction && String(selectedPrediction.prediction_id) === String(recommendationPredictionId)
      ? selectedPrediction
      : null) ||
    history.find(item => String(item.prediction_id) === String(recommendationPredictionId)) ||
    null;

  const activeUrgency = activePrediction?.urgency || "";
  const urgencyGuidance = URGENCY_GUIDANCE[activeUrgency] || FALLBACK_GUIDANCE;
  const isProminentUrgency = urgencyGuidance.isProminent;
  const activeRecommendationData =
    recommendationData && String(recommendationData.prediction_id) === String(recommendationPredictionId)
      ? recommendationData
      : null;

  return (
    <div className="py-2">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
          <Link to="/buyer" className="underline">Buyer dashboard</Link>
          {" / "}
          <Link to="/buyer/engines" className="underline">My Engines</Link>
          {" / RUL Analysis"}
        </nav>
        {engineId && (
          <Link
            to={`/buyer/engines/${encodeURIComponent(engineId)}`}
            className="text-sm font-semibold text-primary-700 underline"
          >
            View engine record
          </Link>
        )}
      </div>

      <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Engine Health &amp; RUL Analysis</h1>
      <p className="mt-2 max-w-3xl text-slate-600 text-sm leading-relaxed">
        Analyze engine operating data to estimate Remaining Useful Life (RUL), monitor engine health, and support replacement planning.
      </p>

      <form onSubmit={onSubmit} className="card mt-6 max-w-3xl space-y-6 p-5 sm:p-7">
        <div>
          <label htmlFor="rul-engine" className="mb-2 block font-semibold text-sm text-slate-900">
            1. Select one of your company’s engines
          </label>
          <select id="rul-engine" className="input w-full" value={engineId} onChange={onEngineChange}
            required disabled={busy || loadingEngines}>
            <option value="">
              {loadingEngines ? "Loading engines…" : engines.length ? "Select engine" : "No company engines found"}
            </option>
            {engines.map(engine => (
              <option key={engine.engineId} value={String(engine.engineId)}>
                {engine.engineCode || engine.serialNumber || `Engine ${engine.engineId}`}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Associates condition measurements with this company fleet asset for historical tracking.
          </p>
        </div>

        <div>
          <label htmlFor="rul-source" className="mb-2 block font-semibold text-sm text-slate-900">
            2. Classify telemetry data source
          </label>
          <select id="rul-source" className="input w-full" value={sourceClassification}
            onChange={event => {
              setSourceClassification(event.target.value);
              resetPredictionView();
            }} required disabled={busy}>
            <option value="">Select source</option>
            <option value="NASA_CMAPSS_FD002">Standard reference benchmark sample</option>
            <option value="CUSTOM_SYNTHETIC">Custom synthetic telemetry</option>
            <option value="EXTERNAL_MAPPED">Externally sourced, mapped telemetry</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Select the appropriate dataset provenance classification for this condition analysis.
          </p>
        </div>

        {/* Engine Condition Data — CSV Requirements Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-sm font-bold text-slate-900">Engine Condition Data — CSV Requirements</h3>
            </div>
            <button
              type="button"
              onClick={downloadSampleCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors self-start sm:self-auto shrink-0"
              title="Download a verified 30-cycle sample CSV that adheres to the contract"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Example CSV</span>
            </button>
          </div>

          <div className="mt-3.5 space-y-2.5 text-xs text-slate-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span><strong>Required Columns (19 total):</strong> Header row must include <code>unit, cycle, setting_1, setting_2, setting_3</code> and sensors <code>sensor_2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 15, 17, 20, 21</code>.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span><strong>Minimum History:</strong> At least 30 observations (rows) representing consecutive cycles for a single engine unit.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span><strong>Numeric &amp; Complete:</strong> All values must be valid finite numbers; no missing, blank, or null cells.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold shrink-0">!</span>
                <span><strong>No Target Labels:</strong> Do not include ground-truth columns (e.g. <code>rul, target, label</code>). Max file size 1 MiB in UTF-8.</span>
              </div>
            </div>

            {/* Collapsible/Expandable schema preview */}
            <div className="mt-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSpecDetails(prev => !prev)}
                className="text-xs font-semibold text-[#0B1F3A] hover:text-[#2D9CDB] flex items-center gap-1 transition-colors"
              >
                <span>{showSpecDetails ? "Hide column format preview" : "View column schema & sample preview"}</span>
                <svg className={`w-3.5 h-3.5 transform transition-transform ${showSpecDetails ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSpecDetails && (
                <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 overflow-x-auto text-[11px] font-mono text-slate-700">
                  <p className="text-slate-400 font-sans mb-1 text-[11px] font-semibold">CSV Header &amp; Top 2 Observations:</p>
                  <pre className="whitespace-pre overflow-x-auto leading-relaxed">
{`unit,cycle,setting_1,setting_2,setting_3,sensor_2,sensor_3,sensor_4,sensor_7,sensor_8,sensor_9,sensor_11,sensor_12,sensor_13,sensor_14,sensor_15,sensor_17,sensor_20,sensor_21
1,1,9.9987,0.2502,100.0,605.03,1497.17,1304.99,394.54,2318.96,8763.8,45.61,371.69,2388.18,8114.1,8.6476,369,28.42,17.1551
1,2,20.0026,0.7000,100.0,607.82,1481.20,1246.11,334.36,2323.95,8713.21,44.26,315.32,2388.12,8053.06,9.2405,364,24.29,14.8039`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="rul-file" className="mb-2 block font-semibold text-sm text-slate-900">
            3. Upload compatible sensor CSV
          </label>
          <input id="rul-file" className="input w-full" type="file" accept=".csv,text/csv"
            required disabled={busy} onChange={onFileChange}/>
          <p className="mt-1 text-xs text-slate-500">
            Upload a CSV containing the required engine operating-condition and sensor measurements.
          </p>
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy || !engineId || !file || !sourceClassification}>
          {busy ? "Running analysis…" : "4. Predict remaining useful life"}
        </button>
        {busy && <p role="status" className="text-xs text-slate-600">Validating CSV, running analysis model, and saving results…</p>}
        {error && <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
      </form>

      {result && (
        <section aria-labelledby="rul-result-title" className="card mt-6 max-w-3xl p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 id="rul-result-title" className="text-xl font-bold text-primary-900">
                RUL Analysis Result
              </h2>
              {engineDisplayName && (
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Engine: <span className="font-semibold text-slate-700">{engineDisplayName}</span>
                  {result.prediction_id && ` · Prediction #${result.prediction_id}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Prediction saved successfully
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50/80 rounded-xl p-5 border border-slate-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estimated Remaining Useful Life
              </p>
              <p className="mt-1 text-3xl sm:text-4xl font-extrabold tabular-nums text-primary-900">
                {Number(result.predicted_rul).toFixed(2)}{" "}
                <span className="text-base font-semibold text-slate-600">cycles</span>
              </p>
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:pl-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Engine Condition Status
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                {result.urgency && <EngineUrgencyBadge urgency={result.urgency} />}
                <span className="text-base font-bold text-slate-800">
                  {STATUS_LABEL[result.urgency] || result.urgency}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-2">
              <span>Source: {SOURCE_LABEL[result.source_classification] || result.source_classification}</span>
              {(result.is_demo || result.source_classification === "NASA_CMAPSS_FD002") && (
                <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  Demo Data
                </span>
              )}
            </div>
            <Link to="/marketplace" className="text-xs font-semibold text-primary-700 hover:text-accent underline">
              Browse marketplace &rarr;
            </Link>
          </div>
        </section>
      )}

      {recommendationPredictionId && (
        <section aria-labelledby="replacement-recommendations-title" className="mt-8 max-w-5xl space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="replacement-recommendations-title" className="text-xl font-bold text-primary-900">
              {urgencyGuidance.sectionHeading}
            </h2>
            {activeRecommendationData?.already_saved && (
              <p className="text-xs text-neutral-500">
                Showing saved recommendations for prediction #{activeRecommendationData.prediction_id}
              </p>
            )}
          </div>

          <div className={urgencyGuidance.containerClass}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {activeUrgency && <EngineUrgencyBadge urgency={activeUrgency} />}
                <span className={`text-xs font-semibold ${urgencyGuidance.statusTextClass}`}>
                  {STATUS_LABEL[activeUrgency] || urgencyGuidance.statusSummary}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Prediction #{recommendationPredictionId}
                {activePrediction?.predicted_rul != null
                  ? ` · ${Number(activePrediction.predicted_rul).toFixed(2)} cycles`
                  : ""}
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold text-slate-900 sm:text-lg">{urgencyGuidance.heading}</h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{urgencyGuidance.description}</p>
          </div>

          {loadingRecommendations ? (
            <div className="card p-5" role="status">
              <p className="text-sm font-medium text-primary-800">
                Loading replacement options for prediction #{recommendationPredictionId}…
              </p>
            </div>
          ) : null}

          {recommendationError && (
            <div className="card border-red-200 bg-red-50/50 p-4 sm:p-5" role="alert">
              <p className="text-sm font-semibold text-red-800">
                {recommendationError}
              </p>
              <button type="button" className="btn btn-secondary mt-3"
                onClick={retryRecommendations} disabled={loadingRecommendations}>
                Retry recommendations
              </button>
            </div>
          )}

          {!loadingRecommendations && !recommendationError && activeRecommendationData?.recommendation_status === "NO_MATCH" && (
            <div className="card p-6 sm:p-7">
              <div className="max-w-xl">
                <h3 className="text-base font-bold text-primary-900">
                  No matching engine listings are currently available.
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  Explore available options in our marketplace.
                </p>
                <div className="mt-4">
                  <Link to="/marketplace" className="btn btn-secondary inline-flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Explore Marketplace</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!loadingRecommendations && !recommendationError && activeRecommendationData?.recommendation_status === "FAILED" && (
            <div className="card p-5">
              <p className="text-sm font-medium text-primary-800">
                Recommendations are currently unavailable for prediction #{recommendationPredictionId}.
              </p>
              <button type="button" className="btn btn-secondary mt-3" onClick={retryRecommendations}>
                Retry recommendations
              </button>
            </div>
          )}

          {!loadingRecommendations && !recommendationError && activeRecommendationData?.recommendation_status === "NOT_RUN" && (
            <div className="card p-5">
              <p className="text-sm font-medium text-primary-800">
                Recommendations have not been generated for prediction #{recommendationPredictionId}.
              </p>
              <button type="button" className="btn btn-secondary mt-3" onClick={retryRecommendations}>
                Generate recommendations
              </button>
            </div>
          )}

          {!loadingRecommendations && !recommendationError && activeRecommendationData?.recommendations?.length > 0 && (
            <ol className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {activeRecommendationData.recommendations.map(item => (
                <li
                  key={`${item.listing_id}-${item.rank_position}`}
                  className="card flex flex-col gap-3 p-5 border-slate-200 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center rounded bg-primary-700 px-2 py-0.5 text-xs font-semibold text-white">
                        Option #{item.rank_position}
                      </span>
                      <h3 className="mt-1.5 text-base font-bold text-primary-900">
                        {item.product_name}
                      </h3>
                    </div>
                    <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {item.condition}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    {item.manufacturer} · Supplier: <span className="font-medium text-slate-800">{item.supplier_name}</span>
                  </p>

                  <div className="flex items-baseline justify-between pt-1">
                    <p className="text-2xl font-extrabold tabular-nums text-primary-900">
                      {CURRENCY_FORMATTER.format(Number(item.price))}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.stock_quantity} in stock · {item.lead_time_days} days lead time
                    </p>
                  </div>

                  {item.compatibility?.evidence_reference && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs">
                      <p className="font-semibold text-slate-700">Compatibility Reference</p>
                      <p className="mt-0.5 text-slate-600 break-words">{item.compatibility.evidence_reference}</p>
                    </div>
                  )}

                  {cartStatus.listingId === String(item.listing_id) && cartStatus.message && (
                    <div
                      role="status"
                      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                        cartStatus.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      <span>{cartStatus.message}</span>
                      {cartStatus.type === "success" && (
                        <Link
                          to="/cart"
                          className="font-bold underline text-emerald-900 hover:text-emerald-700 whitespace-nowrap"
                        >
                          View Cart &rarr;
                        </Link>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    <Link
                      className="btn btn-secondary text-xs"
                      to={`/marketplace/products/${encodeURIComponent(item.product_id)}`}
                    >
                      View Product
                    </Link>
                    <button
                      className="btn btn-primary text-xs"
                      type="button"
                      onClick={() => addRecommendationToCart(item)}
                      disabled={addingListingId === String(item.listing_id) || Number(item.stock_quantity) < 1}
                    >
                      {addingListingId === String(item.listing_id) ? "Adding…" : "Add to Cart"}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {engineId && (
        <section aria-labelledby="rul-history-title" className="mt-8 max-w-3xl">
          <h2 id="rul-history-title" className="text-xl font-bold text-primary-900">
            Saved Prediction History
          </h2>
          {loadingHistory ? (
            <p role="status" className="mt-3 text-sm text-slate-500">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No saved predictions for this engine.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {history.map(item => {
                const isSelected = String(item.prediction_id) === String(recommendationPredictionId);
                return (
                  <li
                    key={item.prediction_id}
                    className={
                      isSelected
                        ? "card border-primary-600 bg-primary-50/20 p-5 shadow-xs"
                        : "card p-5"
                    }
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold tabular-nums text-primary-900">
                          {item.predicted_rul != null ? Number(item.predicted_rul).toFixed(2) : "—"} cycles
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {STATUS_LABEL[item.urgency] || item.status}
                        </span>
                      </div>
                      {item.urgency && <EngineUrgencyBadge urgency={item.urgency} />}
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Date: </span>
                        <span className="font-medium text-slate-700">
                          {item.prediction_date ? new Date(item.prediction_date).toLocaleString() : "Unknown date"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Prediction ID: </span>
                        <span className="font-medium text-slate-700">#{item.prediction_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Data Source: </span>
                        <span className="font-medium text-slate-700">
                          {SOURCE_LABEL[item.source_classification] || item.source_classification}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Replacement Options: </span>
                        <span className="font-medium text-slate-700">
                          {formatRecommendationStatus(item.recommendation_status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        className="btn btn-secondary text-xs"
                        aria-pressed={isSelected}
                        onClick={() => loadSavedRecommendations(item)}
                        disabled={loadingRecommendations}
                      >
                        View Saved Recommendations
                      </button>
                      {isSelected && (
                        <span className="text-xs font-semibold text-primary-700">
                          Currently selected above
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
