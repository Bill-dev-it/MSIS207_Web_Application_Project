export function PredictionHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center text-xs text-slate-500">
        No past prediction records found for this engine.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Prediction History ({history.length})
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Audited historical inferences and cycle degradation metrics
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3">Inference Date</th>
              <th className="px-5 py-3">Operating Cycle</th>
              <th className="px-5 py-3">Predicted RUL</th>
              <th className="px-5 py-3">Urgency Classification</th>
              <th className="px-5 py-3">ML Model</th>
              <th className="px-5 py-3">Source Dataset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {history.map((h) => (
              <tr key={h.predictionId} className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 text-slate-600">
                  {new Date(h.predictionDate).toLocaleString()}
                </td>
                <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                  {h.cycle}
                </td>
                <td className="px-5 py-3.5 font-mono font-bold">
                  <span className={h.predictedRul < 20 ? "text-red-600" : "text-slate-900"}>
                    {h.predictedRul} cycles
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      h.urgency === "PRIORITIZE"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : h.urgency === "PREPARE"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : h.urgency === "MONITOR"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {h.urgency}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-500">
                  {h.modelName} ({h.modelVersion})
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-500">
                  {h.fileName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

