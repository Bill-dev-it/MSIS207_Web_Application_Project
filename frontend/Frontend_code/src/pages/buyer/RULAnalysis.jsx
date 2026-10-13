import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { engineApi } from "../../services/engineApi";
import { rulApi } from "../../services/rulApi";
import RULGauge from "../../components/engine/RULGauge";
import UrgencyBadge from "../../components/engine/UrgencyBadge";

export default function RULAnalysis() {
  const [params] = useSearchParams();
  const [engines, setEngines] = useState([]);
  const [engineId, setEngineId] = useState(params.get("engine") || "");
  const [file, setFile] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    engineApi.listMyEngines().then((list) => {
      setEngines(list);
      if (!engineId && list.length) setEngineId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRun() {
    if (!engineId) return;
    setRunning(true);
    setResult(null);
    const prediction = await rulApi.predict(engineId);
    setResult(prediction);
    setRunning(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-primary-800">RUL Analysis</h1>

      <div className="card space-y-4 p-4">
        <div>
          <label className="label">Select Engine</label>
          <select className="input max-w-xs" value={engineId} onChange={(e) => { setEngineId(e.target.value); setResult(null); }}>
            {engines.map((e) => (
              <option key={e.id} value={e.id}>{e.id} — {e.model}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Upload Sensor Data (CSV)</label>
          <input type="file" accept=".csv" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <p className="mt-1 text-xs text-neutral-500">
            {file ? `Selected: ${file.name}` : "Demo mode: prediction uses the engine's existing sensor history."}
          </p>
        </div>
        <button className="btn-primary" onClick={handleRun} disabled={!engineId || running}>
          {running ? "Running Prediction…" : "Run Prediction"}
        </button>
      </div>

      {result && (
        <div className="card space-y-4 p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <RULGauge rul={result.predictedRul} />
            <div className="text-center sm:text-left">
              <p className="text-sm text-neutral-500">Predicted RUL</p>
              <p className="mono text-2xl font-bold text-primary-800">{result.predictedRul} cycles</p>
              <div className="mt-2">
                <UrgencyBadge urgency={result.urgency} />
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-primary-800 sm:text-left">
            <span className="font-medium">Interpretation:</span> {result.interpretation}
          </p>
          <div className="text-center sm:text-left">
            <Link to={`/buyer/recommendations?engine=${engineId}`} className="btn-primary">
              View Compatible Replacement Options
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
