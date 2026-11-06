import { Link } from "react-router-dom";
import { EngineUrgencyBadge } from "./EngineUrgencyBadge";

export function EngineCards({ engines }) {
  if (engines.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <p className="text-sm font-semibold text-slate-700">No engines found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {engines.map((eng) => (
        <div
          key={eng.engineId}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono text-sm font-black text-slate-900">
                {eng.engineCode}
              </span>
              <EngineUrgencyBadge urgency={eng.urgency} />
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>
                <span className="font-semibold text-slate-800">{eng.model.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Aircraft:</span>
                <span className="font-semibold text-slate-800">
                  {eng.aircraft.tailNumber} ({eng.aircraft.model})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Cycle:</span>
                <span className="font-mono font-semibold text-slate-800">{eng.currentCycle}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-slate-400">Predicted RUL:</span>
                <span className="font-mono font-bold text-sm">
                  {eng.predictedRul != null ? (
                    <span className={eng.urgency === "PRIORITIZE" ? "text-red-600" : "text-slate-900"}>
                      {eng.predictedRul} cycles
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">Not analyzed</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to={`/buyer/engines/${eng.engineId}`}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 underline"
            >
              Engine Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
