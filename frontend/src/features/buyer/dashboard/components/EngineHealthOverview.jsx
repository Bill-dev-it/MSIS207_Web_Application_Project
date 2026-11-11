import { Link } from "react-router-dom";

export function EngineHealthOverview({ engines = [] }) {
  function getUrgencyBadge(urgency) {
    switch (urgency) {
      case "PRIORITIZE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Prioritize
          </span>
        );
      case "PREPARE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Prepare
          </span>
        );
      case "MONITOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Monitor
          </span>
        );
      case "NORMAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Normal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            Not Analyzed
          </span>
        );
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Engine Fleet Health
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered propulsion units, operating cycles &amp; stored RUL records
          </p>
        </div>
        <Link
          to="/buyer/engines"
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors"
        >
          <span>View all engines</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      {engines.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center grow">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-800">No fleet engines registered</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Add company turbofan engines to track operating cycles, maintenance telemetry, and stored RUL records.
          </p>
          <Link
            to="/buyer/engines"
            className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0B1F3A] text-white hover:bg-slate-800 transition-colors"
          >
            Register Engine
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto grow">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Engine ID</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Aircraft / Tail</th>
                <th className="px-5 py-3">Current Cycle</th>
                <th className="px-5 py-3">Latest RUL</th>
                <th className="px-5 py-3">Urgency Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {engines.map((eng) => (
                <tr key={eng.engineId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900 font-mono text-xs">
                    <Link
                      to={`/buyer/engines/${encodeURIComponent(eng.engineId)}`}
                      className="text-sky-700 hover:text-sky-900 hover:underline"
                    >
                      {eng.engineCode}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                    {eng.modelName}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 font-mono">{eng.aircraftTail || "—"}</span>
                    {eng.aircraftModel && (
                      <span className="text-slate-400 block text-[11px]">{eng.aircraftModel}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-800">
                    {Number(eng.currentCycle).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs font-bold">
                    {eng.predictedRul != null ? (
                      <span className={eng.urgency === "PRIORITIZE" ? "text-rose-600" : "text-slate-900"}>
                        {Number(eng.predictedRul).toLocaleString()} cycles
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
                      to={`/buyer/engines/${encodeURIComponent(eng.engineId)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                    >
                      <span>Inspect</span>
                      <span aria-hidden="true">&rarr;</span>
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
