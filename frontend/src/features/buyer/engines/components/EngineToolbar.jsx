export function EngineToolbar({
  search,
  onSearchChange,
  urgency,
  onUrgencyChange,
  counts,
  viewMode,
  onViewModeToggle,
  onRegisterClick,
}) {
  const filterPills = [
    { key: "ALL", label: "All Engines", count: counts.ALL },
    { key: "PRIORITIZE", label: "Prioritize", count: counts.PRIORITIZE },
    { key: "PREPARE", label: "Prepare", count: counts.PREPARE },
    { key: "MONITOR", label: "Monitor", count: counts.MONITOR },
    { key: "NORMAL", label: "Normal", count: counts.NORMAL },
    { key: "NOT_ANALYZED", label: "Not Analyzed", count: counts.NOT_ANALYZED },
  ];

  return (
    <div className="space-y-4">
      {/* Top Title & Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Engines Fleet
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registered fleet: <span className="font-semibold text-slate-700">{counts.ALL} engines</span> across{" "}
            <span className="font-semibold text-slate-700">{counts.aircraftCount} aircraft</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-slate-500 max-w-xs hidden lg:block">
            Track company aircraft engines and evaluate advisory Remaining Useful Life (RUL) health predictions.
          </p>
          {onRegisterClick && (
            <button
              type="button"
              onClick={onRegisterClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F3A] hover:bg-[#16335a] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Register Engine</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & View Mode Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search Input */}
        <div className="relative max-w-sm w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search engine code, model, tail #..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {filterPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => onUrgencyChange(pill.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                urgency === pill.key
                  ? "bg-[#0B192C] text-white font-bold shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
              }`}
            >
              {pill.label} ({pill.count})
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
          <button
            onClick={() => onViewModeToggle("table")}
            className={`p-1.5 rounded text-xs font-semibold ${
              viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
            title="Table View"
          >
            ☰
          </button>
          <button
            onClick={() => onViewModeToggle("cards")}
            className={`p-1.5 rounded text-xs font-semibold ${
              viewMode === "cards" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
            title="Cards View"
          >
            ☷
          </button>
        </div>
      </div>
    </div>
  );
}
