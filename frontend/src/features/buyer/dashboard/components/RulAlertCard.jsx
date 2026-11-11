import { Link } from "react-router-dom";

export function RulAlertCard({ alert }) {
  if (!alert) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  No stored RUL assessments yet
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  No Assessment Data
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Engine operational health cannot be determined without stored prediction data. Register company turbofans or execute RUL analysis to establish predictive maintenance records.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                AeroRUL reads stored prediction records and does not run real-time inference from this dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Link
              to="/buyer/rul"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              RUL Analysis
            </Link>
            <Link
              to="/buyer/engines"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0B1F3A] text-white hover:bg-slate-800 transition-colors"
            >
              My Engines
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 uppercase tracking-wider">
                Operational Attention Required
              </span>
              <span className="text-xs font-medium text-amber-800">
                Critical Stored Prediction
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-base font-bold text-slate-900">
                {alert.engineCode}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {alert.modelName}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {alert.predictedRul} cycles remaining
              </span>
            </div>

            <p className="mt-2 text-xs text-amber-900/90 leading-relaxed max-w-2xl">
              <strong>Advisory:</strong> Stored prediction record indicates impending threshold. Validate telemetry with certified powerplant engineering before scheduling shop maintenance. No model inference is executed on this screen.
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-center">
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
            to={`/buyer/engines/${encodeURIComponent(alert.engineId)}`}
          >
            <span>Inspect Engine Record</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
