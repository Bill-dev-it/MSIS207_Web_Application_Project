import { Link } from "react-router-dom";

export function EngineHealthOverview({ engines }) {
  function getUrgencyBadge(urgency) {
    switch (urgency) {
      case "PRIORITIZE":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
            Prioritize
          </span>
        );
      case "PREPARE":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Prepare
          </span>
        );
      case "MONITOR":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Monitor
          </span>
        );
      case "NORMAL":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Normal
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Not Analyzed
          </span>
        );
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Engine Fleet Health Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Stored prediction records and current engine data
          </p>
        </div>
        <Link
          to="/buyer/engines"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All Fleet &rarr;
        </Link>
      </div>

      {engines.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No engine records registered in your fleet inventory.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Engine ID</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Aircraft</th>
                <th className="px-5 py-3">Current Cycle</th>
                <th className="px-5 py-3">Latest RUL</th>
                <th className="px-5 py-3">Urgency</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {engines.map((eng) => (
                <tr key={eng.engineId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                    <Link
                      to={`/buyer/engines/${eng.engineId}`}
                      className="hover:text-blue-600 underline"
                    >
                      {eng.engineCode}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                    {eng.modelName}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">{eng.aircraftTail}</span>
                    <span className="text-slate-400 block text-[11px]">{eng.aircraftModel}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-800">
                    {eng.currentCycle}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold">
                    {eng.predictedRul != null ? (
                      <span className={eng.urgency === "PRIORITIZE" ? "text-red-600" : "text-slate-900"}>
                        {eng.predictedRul} cycles
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">--</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {getUrgencyBadge(eng.urgency)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/buyer/engines/${eng.engineId}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 transition-colors"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
