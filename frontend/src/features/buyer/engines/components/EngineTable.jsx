import { Link } from "react-router-dom";
import { EngineUrgencyBadge } from "./EngineUrgencyBadge";

export function EngineTable({ engines, onRegisterClick }) {
  if (engines.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 sm:p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-800">No company engines found</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No engine records match your current criteria. Register a company engine to get started.
        </p>
        {onRegisterClick && (
          <button
            type="button"
            onClick={onRegisterClick}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F3A] hover:bg-[#16335a] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Register Engine</span>
          </button>
        )}
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
                    to={`/buyer/engines/${eng.engineId}`}
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
                    <span className={eng.urgency === "PRIORITIZE" ? "text-red-600" : "text-slate-900"}>
                      {eng.predictedRul} cycles
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">Not analyzed yet</span>
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
                    to={`/buyer/engines/${eng.engineId}`}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Details
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
