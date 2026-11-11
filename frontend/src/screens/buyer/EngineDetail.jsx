import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useEngineDetail } from "../../features/buyer/engines/hooks/useEngineDetail";
import { EngineUrgencyBadge } from "../../features/buyer/engines/components/EngineUrgencyBadge";
import { updateEngine } from "../../features/buyer/engines/services/engineApi";

export default function EngineDetail() {
  const { engineId } = useParams();
  const { engine, uploads, loading, error, refresh } = useEngineDetail(engineId);

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState("");
  const [editSerial, setEditSerial] = useState("");
  const [editCycle, setEditCycle] = useState("0");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  useEffect(() => {
    if (engine) {
      setEditCode(engine.engineCode || "");
      setEditSerial(engine.serialNumber || "");
      setEditCycle(String(engine.currentCycle ?? 0));
    }
  }, [engine]);

  function handleStartEdit() {
    if (!engine) return;
    setEditCode(engine.engineCode || "");
    setEditSerial(engine.serialNumber || "");
    setEditCycle(String(engine.currentCycle ?? 0));
    setEditError("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditError("");
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditError("");

    if (!editCode.trim()) {
      setEditError("Engine code is required.");
      return;
    }
    if (!editSerial.trim()) {
      setEditError("Serial number is required.");
      return;
    }

    setSaving(true);
    try {
      await updateEngine(engineId, {
        engine_code: editCode.trim(),
        serial_number: editSerial.trim(),
        current_cycle: Math.max(0, parseInt(editCycle, 10) || 0),
      });
      await refresh();
      setIsEditing(false);
      setEditSuccess("Engine details updated successfully.");
      setTimeout(() => setEditSuccess(""), 5000);
    } catch (err) {
      setEditError(err.message || "Failed to update engine details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading engine details...</p>
        </div>
      </div>
    );
  }

  if (error || !engine) {
    return (
      <div>
        <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center max-w-lg mx-auto my-12">
          <p className="font-bold text-red-800">Engine Record Not Found</p>
          <p className="text-sm text-red-600 mt-1">{error || "Unable to access this engine."}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={refresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
            >
              Retry
            </button>
            <Link
              to="/buyer/engines"
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300"
            >
              Back to Fleet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pred = engine.latestPrediction;

  return (
    <div>
      <div className="space-y-6">
        {/* Success Banner */}
        {editSuccess && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>{editSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditSuccess("")}
              className="text-emerald-600 hover:text-emerald-900 font-bold ml-2"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to="/buyer/engines"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2"
            >
              &larr; Back to My Engines Fleet
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {engine.engineCode}
              </h1>
              {pred ? (
                <EngineUrgencyBadge urgency={pred.urgency} />
              ) : (
                <EngineUrgencyBadge urgency="NOT_ANALYZED" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Serial Number: <span className="font-mono text-slate-700">{engine.serialNumber}</span> &bull; 
              Added: {new Date(engine.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Engine</span>
              </button>
            )}

            <Link
              to={`/buyer/rul?engineId=${encodeURIComponent(engine.engineId)}`}
              className="inline-flex rounded-lg bg-primary-700 px-4 py-2 text-xs font-bold text-white hover:bg-primary-800 transition-colors shadow-xs"
            >
              Run RUL Analysis
            </Link>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Engine & Aircraft Specifications / Inline Edit Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isEditing ? "Edit Engine Information" : "Technical Specifications & Aircraft Fitment"}
              </h2>
              {isEditing ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Editing Mode
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                {editError && (
                  <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    {editError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Engine Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    maxLength={80}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serial Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editSerial}
                    onChange={(e) => setEditSerial(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    maxLength={100}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Operating Cycles <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editCycle}
                    onChange={(e) => setEditCycle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    disabled={saving}
                  />
                </div>

                {/* Read-only reference metadata */}
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1 bg-slate-50/70 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span>Engine Model (fixed):</span>
                    <span className="font-semibold text-slate-700">{engine.model.manufacturer} {engine.model.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned Aircraft (fixed):</span>
                    <span className="font-semibold text-slate-700">{engine.aircraft.tailNumber} ({engine.aircraft.model})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database Engine ID:</span>
                    <span className="font-mono font-semibold text-slate-700">#{engine.engineId}</span>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 bg-[#0B1F3A] hover:bg-[#16335a] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Engine Model:</span>
                    <span className="font-semibold text-slate-800 text-sm">{engine.model.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Manufacturer:</span>
                    <span className="font-semibold text-slate-800 text-sm">{engine.model.manufacturer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Engine Family:</span>
                    <span className="font-semibold text-slate-800">{engine.model.family || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Engine Type:</span>
                    <span className="font-semibold text-slate-800">{engine.model.type || "Not specified"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Assigned Aircraft Tail:</span>
                    <span className="font-bold text-slate-900 text-sm">{engine.aircraft.tailNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Aircraft Model:</span>
                    <span className="font-semibold text-slate-800">{engine.aircraft.model}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Current Operating Cycle:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{engine.currentCycle} cycles</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Aircraft Status:</span>
                    <span className="font-semibold text-emerald-600">{engine.aircraft.status}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Card 2: Latest RUL Prediction Snapshot */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                Latest stored RUL prediction
              </h2>

              {pred ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-black font-mono text-slate-900">
                        {pred.predictedRul}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ml-1.5">
                        cycles remaining
                      </span>
                    </div>
                    <EngineUrgencyBadge urgency={pred.urgency} />
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {pred.explanation}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <div>
                      <span>Cycle at Prediction: </span>
                      <span className="font-mono font-semibold text-slate-700">{pred.cycleAtPrediction}</span>
                    </div>
                    <div>
                      <span>Analyzed On: </span>
                      <span className="font-semibold text-slate-700">
                        {new Date(pred.predictionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span>Model Version: </span>
                      <span className="font-mono font-semibold text-slate-700">
                        {pred.modelName} ({pred.modelVersion})
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <p>No successful RUL prediction is stored for this engine.</p>
                  <p className="mt-1">No demo prediction has been saved for this engine.</p>
                </div>
              )}
            </div>

            <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
              Uploaded FD002 files are private and retained with successful predictions only.
            </p>
          </div>
        </div>

        {/* Sensor Upload History Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Sensor Upload History ({uploads.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Raw telemetry files uploaded and validated for predictive analysis
            </p>
          </div>

          {uploads.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No telemetry dataset files have been uploaded for this engine yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">File Name</th>
                    <th className="px-5 py-3">Cycle Range</th>
                    <th className="px-5 py-3">Row Count</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Uploaded Date</th>
                    <th className="px-5 py-3">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uploads.map((up) => (
                    <tr key={up.uploadId} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-900">
                        {up.fileName}
                      </td>
                      <td className="px-5 py-3 font-mono">
                        {up.firstCycle != null ? `${up.firstCycle} - ${up.lastCycle}` : "--"}
                      </td>
                      <td className="px-5 py-3 font-mono">{up.rowCount} rows</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {up.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(up.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{up.uploadedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
