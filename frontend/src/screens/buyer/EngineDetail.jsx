import { Link, useParams } from "react-router-dom";
import { useEngineDetail } from "../../features/buyer/engines/hooks/useEngineDetail";
import { EngineUrgencyBadge } from "../../features/buyer/engines/components/EngineUrgencyBadge";

export default function EngineDetail() {
  const { engineId } = useParams();
  const { engine, uploads, loading, error, refresh } = useEngineDetail(engineId);

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

          <div className="max-w-sm space-y-2">
            <p className="text-sm text-slate-600">
              FD002 demo analysis uses simulator data and does not represent this engine&apos;s actual telemetry.
            </p>
            <Link
              to={`/buyer/rul?engineId=${encodeURIComponent(engine.engineId)}`}
              className="inline-flex rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Run FD002 demo analysis
            </Link>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Engine & Aircraft Specifications */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
              Technical Specifications &amp; Aircraft Fitment
            </h2>

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
