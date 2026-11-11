export function DashboardHeader({ company }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Fleet &amp; Procurement Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor aircraft engines, maintenance insights, and procurement activity.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs shrink-0 self-start sm:self-auto">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
          <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-slate-900 truncate">
              {company?.company_name || "Aviation Operator"}
            </p>
            {company?.country_code && (
              <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                {company.country_code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {company?.company_type || "Verified Buyer"}
            </span>
            {company?.company_id && (
              <span className="text-[10px] text-slate-400">#{company.company_id}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
