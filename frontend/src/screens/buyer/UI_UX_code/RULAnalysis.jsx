import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { addItemToCart } from "../../../features/buyer/cart/services/cartApi";
import { EngineUrgencyBadge } from "../../../features/buyer/engines/components/EngineUrgencyBadge";
import { getEngines } from "../../../features/buyer/engines/services/engineApi";
import {
  generateReplacementRecommendations,
  getReplacementRecommendations,
  getRulHistory,
  predictRul,
} from "../../../features/buyer/rul-analysis/services/rulApi";

const STATUS_LABEL = {
  PRIORITIZE: "Prioritize maintenance planning",
  PREPARE: "Prepare maintenance planning",
  MONITOR: "Monitor engine condition",
  NORMAL: "Normal demo threshold",
};
const SOURCE_LABEL = {
  NASA_CMAPSS_FD002: "NASA C-MAPSS FD002 sample",
  CUSTOM_SYNTHETIC: "Custom synthetic telemetry",
  EXTERNAL_MAPPED: "Externally sourced, mapped telemetry",
  LEGACY_UNCLASSIFIED: "Legacy upload (source not recorded)",
};
const URGENCY_GUIDANCE = {
  PRIORITIZE: {
    heading: "Replacement planning recommended",
    description:
      "The predicted RUL falls within the project's highest-priority planning category. Consider reviewing suitable replacement options.",
    sectionHeading: "Recommended Engine Replacements",
    statusSummary: "High-priority planning category (≤ 20 simulated cycles)",
    isProminent: true,
    containerClass:
      "rounded-[12px] border border-red-300 border-l-4 border-l-red-700 bg-red-50/70 p-4 sm:p-5 text-primary-900",
    statusTextClass: "text-red-900",
  },
  PREPARE: {
    heading: "Prepare replacement options",
    description:
      "The predicted RUL suggests preparing a replacement plan. Compare available listings before making a purchasing decision.",
    sectionHeading: "Recommended Engine Replacements",
    statusSummary: "Advance preparation category (21–40 simulated cycles)",
    isProminent: true,
    containerClass:
      "rounded-[12px] border border-amber-300 border-l-4 border-l-amber-600 bg-amber-50/70 p-4 sm:p-5 text-primary-900",
    statusTextClass: "text-amber-900",
  },
  MONITOR: {
    heading: "Continue monitoring",
    description:
      "The current demo threshold suggests monitoring the engine. Replacement listings are available for optional future planning.",
    sectionHeading: "Alternative Engine Listings",
    statusSummary: "Routine monitoring category (41–80 simulated cycles)",
    isProminent: false,
    containerClass:
      "rounded-[12px] border border-neutral-200 border-l-4 border-l-accent bg-neutral-50 p-4 sm:p-5 text-primary-800",
    statusTextClass: "text-slate-700",
  },
  NORMAL: {
    heading: "Optional replacement planning",
    description:
      "The current demo thresholds do not indicate an immediate replacement priority. The listings below are optional purchasing references, not a recommendation to replace the engine now.",
    sectionHeading: "Alternative Engine Listings",
    statusSummary: "Normal demo threshold (> 80 simulated cycles)",
    isProminent: false,
    containerClass:
      "rounded-[12px] border border-neutral-200 bg-neutral-50 p-4 sm:p-5 text-primary-800",
    statusTextClass: "text-slate-700",
  },
};
const FALLBACK_GUIDANCE = {
  heading: "Replacement listing references",
  description:
    "Review saved replacement listings associated with this RUL prediction.",
  sectionHeading: "Alternative Engine Listings",
  statusSummary: "Saved prediction reference",
  isProminent: false,
  containerClass:
    "rounded-[12px] border border-neutral-200 bg-neutral-50 p-4 sm:p-5 text-primary-800",
  statusTextClass: "text-slate-700",
};
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

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
  const [cartMessage, setCartMessage] = useState("");
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
    getRulHistory(engineId, { signal: abort.signal })
      .then(rows => { if (!abort.signal.aborted) setHistory(Array.isArray(rows) ? rows : []); })
      .catch(e => { if (!abort.signal.aborted) setError(e.message || "Cannot load prediction history."); })
      .finally(() => { if (!abort.signal.aborted) setLoadingHistory(false); });
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
    setCartMessage("");
  }

  function onEngineChange(event) {
    const next = event.target.value;
    setParams(next ? { engineId: next } : {});
    setFile(null);
    resetPredictionView();
  }

  function onFileChange(event) {
    setFile(event.target.files?.[0] || null);
    resetPredictionView();
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
    setCartMessage("");
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
    setCartMessage("");
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
    setAddingListingId(String(recommendation.listing_id));
    setCartMessage("");
    try {
      await addItemToCart(recommendation.listing_id, 1);
      setCartMessage(`${recommendation.product_name} was added to your cart.`);
    } catch (e) {
      setCartMessage(e.message || "This listing could not be added to your cart.");
    } finally {
      setAddingListingId("");
    }
  }

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
      <h1 className="text-2xl font-bold text-primary-800 sm:text-3xl">Engine RUL analysis</h1>
      <p className="mt-3 max-w-3xl text-neutral-700">
        Run the real Condition-Aware iTransformer trained on NASA C-MAPSS FD002.
        Select the uploaded telemetry&apos;s source below. Compatible columns do not
        guarantee accurate predictions; this is an <strong>educational simulation</strong>,
        not certified maintenance advice.
      </p>
      <form onSubmit={onSubmit} className="card mt-6 max-w-3xl space-y-5 p-5 sm:p-7">
        <div>
          <label htmlFor="rul-engine" className="mb-2 block font-semibold">1. Select one of your company’s engines</label>
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
          <p className="mt-1 text-xs text-neutral-600">Selecting an engine explicitly associates a demo FD002 unit with this company asset; unit IDs do not prove engine-model compatibility.</p>
        </div>
        <div>
          <label htmlFor="rul-source" className="mb-2 block font-semibold">2. Classify the CSV source</label>
          <select id="rul-source" className="input w-full" value={sourceClassification}
            onChange={event => {
              setSourceClassification(event.target.value);
              resetPredictionView();
            }} required disabled={busy}>
            <option value="">Select source</option>
            <option value="NASA_CMAPSS_FD002">NASA C-MAPSS FD002 sample</option>
            <option value="CUSTOM_SYNTHETIC">Custom synthetic telemetry</option>
            <option value="EXTERNAL_MAPPED">Externally sourced, mapped telemetry</option>
          </select>
          <p className="mt-1 text-xs text-neutral-600">This is a user-selected provenance label; it does not verify the CSV&apos;s origin.</p>
        </div>
        <div>
          <label htmlFor="rul-file" className="mb-2 block font-semibold">3. Upload compatible sensor CSV</label>
          <input id="rul-file" className="input w-full" type="file" accept=".csv,text/csv"
            required disabled={busy} onChange={onFileChange} />
          <p className="mt-1 text-xs text-neutral-600">UTF-8 without BOM; 19 required columns, one unit, at least 30 observations, maximum 1 MiB. Use raw, unscaled values in compatible physical units; physical units are not independently verified. Do not include ground-truth RUL labels.</p>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy || !engineId || !file || !sourceClassification}>
          {busy ? "Running TensorFlow inference…" : "4. Predict remaining useful life"}
        </button>
        {busy && <p role="status">Validating CSV, running the frozen model, then saving the result…</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </form>
      {result && (
        <section aria-labelledby="rul-result-title" className="card mt-6 max-w-3xl space-y-3 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="rul-result-title" className="text-xl font-semibold">Prediction saved</h2>
            {result.urgency && <EngineUrgencyBadge urgency={result.urgency} />}
          </div>
          <p className="text-4xl font-bold tabular-nums text-primary-800">
            {Number(result.predicted_rul).toFixed(2)}{" "}
            <span className="text-base font-medium">simulated engine cycles</span>
          </p>
          <p>
            <strong>Planning category:</strong> {STATUS_LABEL[result.urgency] || result.urgency}
          </p>
          <p className="text-sm text-neutral-600">
            Source: {SOURCE_LABEL[result.source_classification] || result.source_classification} · Model: {result.model?.name} ({result.model?.version}; trained on {result.model?.dataset_subset}) · demo unit {result.dataset_unit_id} · prediction #{result.prediction_id}
          </p>
          <p className="text-sm text-neutral-600">Demo thresholds only. Not an airworthiness judgment.</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link to="/marketplace" className="btn btn-secondary inline-flex">Browse public marketplace</Link>
          </div>
        </section>
      )}
      {recommendationPredictionId && (
        <section aria-labelledby="replacement-recommendations-title" className="mt-8 max-w-5xl space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="replacement-recommendations-title" className="text-xl font-semibold text-primary-800">
                {urgencyGuidance.sectionHeading}
              </h2>
              {!isProminentUrgency && (
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  Optional purchasing references
                </span>
              )}
            </div>
            {activeRecommendationData?.already_saved && (
              <p className="text-xs text-neutral-600">
                Showing recommendations already saved for prediction #{activeRecommendationData.prediction_id}.
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
              <span className="text-xs font-medium text-neutral-600">
                Prediction #{recommendationPredictionId}
                {activePrediction?.predicted_rul != null
                  ? ` · ${Number(activePrediction.predicted_rul).toFixed(2)} simulated cycles`
                  : ""}
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold sm:text-lg">{urgencyGuidance.heading}</h3>
            <p className="mt-1 text-sm leading-relaxed">{urgencyGuidance.description}</p>
            {!result && activePrediction && (
              <p className="mt-2 text-xs text-neutral-600">
                Showing saved prediction context
                {activePrediction.original_file_name ? ` from ${activePrediction.original_file_name}` : ""}
                {activePrediction.source_classification
                  ? ` (${SOURCE_LABEL[activePrediction.source_classification] || activePrediction.source_classification})`
                  : ""}
                . Academic simulation guidance only; not certified maintenance advice.
              </p>
            )}
            {result && (
              <p className="mt-2 text-xs text-neutral-600">
                Academic simulation guidance only; not certified maintenance advice.
              </p>
            )}
          </div>

          <p className="text-sm text-neutral-600">
            {isProminentUrgency
              ? "Ranking prioritizes recorded compatibility evidence, then lower listing price and shorter lead time. Top 1 means first under the ranking algorithm, not a certified best replacement."
              : "Shown as optional purchasing references for future planning. Ranking prioritizes recorded compatibility evidence, then lower listing price and shorter lead time. Top 1 means first under the ranking algorithm, not a certified best replacement."}
          </p>

          {loadingRecommendations ? (
            <div className="card p-5" role="status">
              <p className="text-sm font-medium text-primary-800">
                Loading replacement recommendations for prediction #{recommendationPredictionId}…
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Your saved RUL prediction and planning category remain preserved.
              </p>
            </div>
          ) : null}

          {recommendationError && (
            <div className="card border-red-200 bg-red-50/50 p-4 sm:p-5" role="alert">
              <p className="text-sm font-semibold text-red-800">
                {recommendationError}
              </p>
              <p className="mt-1 text-xs text-red-900">
                Your successful RUL prediction (#{recommendationPredictionId}) remains saved. Unavailable recommendations do not change the predicted RUL or planning category.
              </p>
              <button type="button" className="btn btn-secondary mt-3"
                onClick={retryRecommendations} disabled={loadingRecommendations}>
                Retry recommendations
              </button>
            </div>
          )}

          {!loadingRecommendations && !recommendationError && activeRecommendationData?.recommendation_status === "NO_MATCH" && (
            <div className="card p-4 sm:p-5">
              <p className="text-sm font-medium text-primary-800">
                No active, stocked engine listings with recorded compatibility evidence were found.
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                The saved RUL prediction (#{recommendationPredictionId}) remains preserved. Having no available marketplace listing reflects current catalog stock and compatibility records only; it does not mean maintenance or replacement planning is unnecessary.
              </p>
            </div>
          )}

          {!loadingRecommendations && !recommendationError && activeRecommendationData?.recommendation_status === "FAILED" && (
            <div className="card p-4 sm:p-5">
              <p className="text-sm font-medium text-primary-800">
                Recommendations are not available yet. Your RUL prediction (#{recommendationPredictionId}) remains saved.
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Recommendation status does not alter the saved RUL prediction or planning urgency.
              </p>
              <button type="button" className="btn btn-secondary mt-3" onClick={retryRecommendations}>
                Retry recommendations
              </button>
            </div>
          )}

          {!loadingRecommendations && !recommendationError && activeRecommendationData?.recommendation_status === "NOT_RUN" && (
            <div className="card p-4 sm:p-5">
              <p className="text-sm font-medium text-primary-800">
                Recommendations have not been generated for prediction #{recommendationPredictionId}.
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Your saved RUL prediction is preserved. You can generate up to 5 ranked listings below.
              </p>
              <button type="button" className="btn btn-secondary mt-3" onClick={retryRecommendations}>
                Generate recommendations
              </button>
            </div>
          )}

          {cartMessage && <p className="text-sm font-medium text-primary-800" role="status">{cartMessage}</p>}

          {!loadingRecommendations && !recommendationError && activeRecommendationData?.recommendations?.length > 0 && (
            <ol
              className={
                isProminentUrgency
                  ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
                  : "grid grid-cols-1 gap-3 lg:grid-cols-2"
              }
            >
              {activeRecommendationData.recommendations.map(item => (
                <li
                  key={`${item.listing_id}-${item.rank_position}`}
                  className={
                    isProminentUrgency
                      ? "card flex flex-col gap-3 border-neutral-200 p-5 shadow-sm"
                      : "flex flex-col gap-3 rounded-[12px] border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5 text-slate-700"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            isProminentUrgency
                              ? "inline-flex items-center rounded bg-primary-700 px-2 py-0.5 text-xs font-semibold text-white"
                              : "inline-flex items-center rounded border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700"
                          }
                        >
                          Rank #{item.rank_position}
                        </span>
                        {!isProminentUrgency && (
                          <span className="text-xs font-medium text-slate-600">
                            Optional reference
                          </span>
                        )}
                      </div>
                      <h3 className={isProminentUrgency ? "mt-1.5 text-lg font-semibold text-primary-800" : "mt-1.5 text-base font-semibold text-primary-800"}>
                        Top {item.rank_position}: {item.product_name}
                      </h3>
                    </div>
                    <span className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-primary-800">
                      {item.condition}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700">{item.manufacturer} · Supplier: {item.supplier_name}</p>
                  <p className={isProminentUrgency ? "text-2xl font-bold tabular-nums text-primary-800" : "text-xl font-semibold tabular-nums text-primary-800"}>
                    {CURRENCY_FORMATTER.format(Number(item.price))}
                    <span className="ml-2 text-xs font-normal text-neutral-600">actual listing price</span>
                  </p>
                  <p className="text-sm">Availability: {item.stock_quantity} in stock · Lead time: {item.lead_time_days} days</p>
                  <div className="rounded border border-neutral-200 bg-white p-3 text-sm">
                    <p className="font-medium text-primary-800">Compatibility evidence{item.compatibility?.is_demo ? " (demo)" : ""}</p>
                    <p className="mt-1 break-words text-neutral-700">{item.compatibility?.evidence_reference}</p>
                    <p className="mt-2 text-xs text-neutral-600">{item.reason}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Link className="btn btn-secondary"
                      to={`/marketplace/products/${encodeURIComponent(item.product_id)}`}>
                      View Product
                    </Link>
                    <button
                      className={isProminentUrgency ? "btn btn-primary" : "btn btn-secondary"}
                      type="button"
                      onClick={() => addRecommendationToCart(item)}
                      disabled={addingListingId === String(item.listing_id) || Number(item.stock_quantity) < 1}>
                      {addingListingId === String(item.listing_id) ? "Adding…" : "Add to Cart"}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {activeRecommendationData && (
            <p className="text-xs text-neutral-600">
              Prices are current actual supplier listing prices, not fair-market valuations. Stock and listing eligibility can change; the cart revalidates availability. Compatibility records, including demo evidence, are not certified installation approval.
            </p>
          )}
        </section>
      )}
      {engineId && (
        <section aria-labelledby="rul-history-title" className="mt-8 max-w-3xl">
          <h2 id="rul-history-title" className="text-xl font-semibold">Saved prediction history</h2>
          {loadingHistory ? <p role="status" className="mt-3">Loading history…</p> : history.length === 0 ?
            <p className="mt-3 text-neutral-600">No saved predictions for this engine.</p> :
            <ul className="mt-4 space-y-3">{history.map(item => {
              const isSelected = String(item.prediction_id) === String(recommendationPredictionId);
              return (
                <li
                  key={item.prediction_id}
                  className={
                    isSelected
                      ? "card border-primary-700 bg-primary-50/30 p-4"
                      : "card p-4"
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      <strong>
                        {item.predicted_rul != null ? Number(item.predicted_rul).toFixed(2) : "—"} cycles
                      </strong>{" "}
                      · {STATUS_LABEL[item.urgency] || item.status}
                    </p>
                    {item.urgency && <EngineUrgencyBadge urgency={item.urgency} />}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {SOURCE_LABEL[item.source_classification] || item.source_classification} · {item.original_file_name} · {item.prediction_date ? new Date(item.prediction_date).toLocaleString() : "Unknown date"} · Prediction #{item.prediction_id} · Recommendations: {item.recommendation_status || "NOT_RUN"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      aria-pressed={isSelected}
                      onClick={() => loadSavedRecommendations(item)}
                      disabled={loadingRecommendations}
                    >
                      View saved recommendations
                    </button>
                    {isSelected && (
                      <span className="text-xs font-semibold text-primary-700">
                        Currently selected above
                      </span>
                    )}
                  </div>
                </li>
              );
            })}</ul>}
        </section>
      )}
    </div>
  );
}
