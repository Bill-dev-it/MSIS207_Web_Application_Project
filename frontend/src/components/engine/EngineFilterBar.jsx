export function EngineFilterBar({
  search,
  onSearchChange,
  urgencyFilter,
  onUrgencyChange,
  manufacturerFilter,
  onManufacturerChange,
  manufacturers = [],
}) {
  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-4 rounded-2xl bg-[#0D1829]/90 border border-slate-800 shadow-lg">
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by engine code, serial, or model..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#091024] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-mono text-white placeholder:text-slate-500 outline-none transition-all"
        />
        <svg
          className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={urgencyFilter}
          onChange={(e) => onUrgencyChange(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#091024] border border-slate-700/80 text-xs font-mono text-slate-200 outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="ALL">All Urgency Levels</option>
          <option value="PRIORITIZE">Prioritize (Critical)</option>
          <option value="PREPARE">Prepare (Warning)</option>
          <option value="MONITOR">Monitor (Watch)</option>
          <option value="NORMAL">Normal (Healthy)</option>
        </select>

        {manufacturers.length > 0 && (
          <select
            value={manufacturerFilter}
            onChange={(e) => onManufacturerChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#091024] border border-slate-700/80 text-xs font-mono text-slate-200 outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="ALL">All Manufacturers</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
