export function DashboardStatCard({ title, value, subtitle, icon, highlight = false, alert = false }) {
  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        alert
          ? "bg-red-50/50 border-red-200"
          : highlight
          ? "bg-blue-50/40 border-blue-200"
          : "bg-white border-slate-200 shadow-xs"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        <span
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
            alert
              ? "bg-red-100 text-red-600"
              : highlight
              ? "bg-blue-100 text-blue-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`text-3xl font-black tracking-tight ${
            alert ? "text-red-600" : "text-slate-900"
          }`}
        >
          {value}
        </span>
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

