export function ModerationFilterBar({ activeStatus, onStatusChange, searchQuery, onSearchChange, totalCount }) {
  const statusOptions = [
    { id: "DRAFT", label: "Pending Review", badgeColor: "text-amber-400 bg-amber-400/10 border-amber-500/30" },
    { id: "APPROVED", label: "Approved & Live", badgeColor: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30" },
    { id: "REJECTED", label: "Rejected", badgeColor: "text-red-400 bg-red-400/10 border-red-500/30" },
    { id: "SUSPENDED", label: "Suspended", badgeColor: "text-slate-400 bg-slate-400/10 border-slate-500/30" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
      {/* Status Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((opt) => {
          const isActive = activeStatus === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onStatusChange(opt.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-2 border ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                  : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input & Total Counter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search part, SKU, supplier..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="text-right text-[11px] font-mono text-slate-500 whitespace-nowrap">
          Items: <span className="text-cyan-400 font-bold">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}
