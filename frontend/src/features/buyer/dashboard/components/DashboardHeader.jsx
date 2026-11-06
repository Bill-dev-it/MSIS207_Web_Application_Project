export function DashboardHeader({ company }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Buyer Operations Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Company engines, stored predictions and order activity.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
          ✈
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">
            {company?.company_name || "Buyer company"}
          </p>
          <span className="inline-block text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {company?.company_type || "Buyer"}
          </span>
        </div>
      </div>
    </div>
  );
}
