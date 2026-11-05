import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getEngines } from "../../features/buyer/engines/services/engineApi";
import { getRulHistory, predictRul } from "../../features/buyer/rul-analysis/services/rulApi";

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
  const requestKeyRef = useRef("");

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

  function onEngineChange(event) {
    const next = event.target.value;
    setParams(next ? { engineId: next } : {});
    setFile(null); setResult(null); setError(""); requestKeyRef.current = "";
  }
  function onFileChange(event) {
    setFile(event.target.files?.[0] || null);
    setResult(null); setError(""); requestKeyRef.current = "";
  }
  async function onSubmit(event) {
    event.preventDefault();
    if (!engineId || !file || busy) return;
    setBusy(true); setError(""); setResult(null);
    try {
      if (!requestKeyRef.current) {
        if (!globalThis.crypto?.randomUUID) throw new Error("Secure request IDs are unavailable in this browser.");
        requestKeyRef.current = globalThis.crypto.randomUUID();
      }
      const data = await predictRul({
        engineId, file, requestKey: requestKeyRef.current, sourceClassification,
      });
      setResult(data);
      setHistory(await getRulHistory(engineId));
    } catch (e) {
      setError(e.message || "RUL inference unavailable.");
    } finally { setBusy(false); }
  }

  return (
    <div className="py-2">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-600">
        <Link to="/buyer" className="underline">Buyer dashboard</Link> / RUL Analysis
      </nav>
      <h1 className="text-2xl font-bold text-primary-800 sm:text-3xl">Engine RUL analysis</h1>
      <p className="mt-3 max-w-3xl text-neutral-700">
        Run the real Condition-Aware iTransformer trained on NASA C-MAPSS FD002.
        Select the uploaded telemetry's source below. Compatible columns do not
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
              setResult(null); setError(""); requestKeyRef.current = "";
            }} required disabled={busy}>
            <option value="">Select source</option>
            <option value="NASA_CMAPSS_FD002">NASA C-MAPSS FD002 sample</option>
            <option value="CUSTOM_SYNTHETIC">Custom synthetic telemetry</option>
            <option value="EXTERNAL_MAPPED">Externally sourced, mapped telemetry</option>
          </select>
          <p className="mt-1 text-xs text-neutral-600">This is a user-selected provenance label; it does not verify the CSV's origin.</p>
        </div>
        <div>
          <label htmlFor="rul-file" className="mb-2 block font-semibold">3. Upload compatible sensor CSV</label>
          <input id="rul-file" className="input w-full" type="file" accept=".csv,text/csv"
            required disabled={busy} onChange={onFileChange}/>
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
          <h2 id="rul-result-title" className="text-xl font-semibold">Prediction saved</h2>
          <p className="text-4xl font-bold tabular-nums text-primary-800">{Number(result.predicted_rul).toFixed(2)} <span className="text-base font-medium">simulated engine cycles</span></p>
          <p><strong>Planning category:</strong> {STATUS_LABEL[result.urgency] || result.urgency}</p>
          <p className="text-sm text-neutral-600">Source: {SOURCE_LABEL[result.source_classification] || result.source_classification} · Model: {result.model?.name} ({result.model?.version}; trained on {result.model?.dataset_subset}) · demo unit {result.dataset_unit_id} · prediction #{result.prediction_id}</p>
          <p className="text-sm text-neutral-600">Demo thresholds only. Not an airworthiness judgment.</p>
          <Link to="/marketplace" className="btn btn-secondary inline-flex">Browse public marketplace</Link>
          <p className="text-xs text-neutral-600">Marketplace offers are not asserted to be compatible with this simulated FD002 unit.</p>
        </section>
      )}
      {engineId && (
        <section aria-labelledby="rul-history-title" className="mt-8 max-w-3xl">
          <h2 id="rul-history-title" className="text-xl font-semibold">Saved prediction history</h2>
          {loadingHistory ? <p role="status" className="mt-3">Loading history…</p> : history.length === 0 ?
            <p className="mt-3 text-neutral-600">No saved predictions for this engine.</p> :
            <ul className="mt-4 space-y-3">{history.map(item => <li key={item.prediction_id} className="card p-4">
              <p><strong>{item.predicted_rul ?? "—"} cycles</strong> · {STATUS_LABEL[item.urgency] || item.status}</p>
              <p className="text-sm text-neutral-600">{SOURCE_LABEL[item.source_classification] || item.source_classification} · {item.original_file_name} · {item.prediction_date ? new Date(item.prediction_date).toLocaleString() : "Unknown date"} · Prediction #{item.prediction_id}</p>
            </li>)}</ul>}
        </section>
      )}
    </div>
  );
}
