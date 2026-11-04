import { Link } from "react-router-dom";
import { EngineUrgencyBadge } from "./EngineUrgencyBadge";

export function EngineTable({ engines }) {
  if (engines.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <p className="text-sm font-semibold text-slate-700">No engines found</p>
        <p className="text-xs text-slate-500 mt-1">
          Try adjusting your search criteria or urgency filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3.5">Engine Code</th>
              <th className="px-6 py-3.5">Model</th>
              <th className="px-6 py-3.5">Aircraft Assigned</th>
              <th className="px-6 py-3.5">Current Cycle</th>
              <th className="px-6 py-3.5">Latest RUL</th>
              <th className="px-6 py-3.5">Urgency</th>
              <th className="px-6 py-3.5">Last Analysis</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {engines.map((eng) => (
              <tr key={eng.engineId} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                  <Link
                    to={`/engines/${eng.engineId}`}
                    className="hover:text-blue-600 underline"
                  >
                    {eng.engineCode}
                  </Link>
                  <span className="block font-sans text-[11px] font-normal text-slate-400">
                    SN: {eng.serialNumber}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                  {eng.model.name}
                  <span className="block text-[11px] font-normal text-slate-400">
                    {eng.model.manufacturer}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs">
                  <span className="font-semibold text-slate-800">{eng.aircraft.tailNumber}</span>
                  <span className="block text-[11px] text-slate-500">{eng.aircraft.model}</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-800">
                  {eng.currentCycle}
                </td>
                <td className="px-6 py-4 font-mono text-xs font-bold">
                  {eng.predictedRul != null ? (
                    <span className={eng.predictedRul < 20 ? "text-red-600" : "text-slate-900"}>
                      {eng.predictedRul} cycles
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">No prediction yet</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <EngineUrgencyBadge urgency={eng.urgency} />
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {eng.lastAnalysis ? new Date(eng.lastAnalysis).toLocaleDateString() : "--"}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                  <Link
                    to={`/engines/${eng.engineId}`}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Details
                  </Link>
                  <Link
                    to={`/rul-analysis?engineId=${eng.engineId}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 transition-colors"
                  >
                    Analyze
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

