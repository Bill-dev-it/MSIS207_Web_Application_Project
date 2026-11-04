import { Link } from "react-router-dom";

export function RulAlertCard({ alert }) {
  if (!alert) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Critical RUL Alert
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Fleet Nominal
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            No engines are currently operating in the critical (<span className="font-semibold text-red-600">&lt; 20 cycles</span>) threshold.
          </p>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            to="/rul-analysis"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
          >
            Run New Telemetry Diagnostics &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-red-50/60 rounded-xl border border-red-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-red-100">
          <span className="text-xs font-bold uppercase tracking-wider text-red-700">
            Critical RUL Alert
          </span>
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
            ACTION REQUIRED
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-black text-slate-900">{alert.engineCode}</p>
            <p className="text-xs text-slate-600">{alert.modelName}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-red-600 font-mono">
              {alert.predictedRul}
            </span>
            <span className="text-xs text-red-700 block font-medium">cycles remaining</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-red-800">
          Engine remaining useful life is critically low. Compatible replacement components are prioritized for urgent dispatch.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-red-200/60 flex items-center justify-between">
        <Link
          to={`/rul-analysis?engineId=${alert.engineId}`}
          className="text-xs font-bold text-red-700 hover:text-red-800 underline"
        >
          View Diagnostics &amp; History
        </Link>
        <Link
          to={`/marketplace?search=${encodeURIComponent(alert.modelName)}`}
          className="px-3.5 py-1.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
        >
          Source Spare Parts
        </Link>
      </div>
    </div>
  );
}

