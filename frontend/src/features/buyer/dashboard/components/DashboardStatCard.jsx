export function DashboardStatCard({
  title,
  value,
  subtitle,
  icon,
  alert = false,
}) {
  return (
    <div
      className={`h-full flex flex-col justify-between p-5 rounded-xl border transition-all ${
        alert
          ? "bg-amber-50/60 border-amber-300 shadow-xs"
          : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">
            {title}
          </p>
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
              alert
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {icon}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-3xl font-bold tracking-tight ${
              alert ? "text-amber-800" : "text-slate-900"
            }`}
          >
            {value}
          </span>
        </div>
      </div>

      {subtitle && (
        <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
