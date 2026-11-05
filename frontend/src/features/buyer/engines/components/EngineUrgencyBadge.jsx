export function EngineUrgencyBadge({ urgency }) {
  switch (urgency) {
    case "PRIORITIZE":
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
          Prioritize
        </span>
      );
    case "PREPARE":
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          Prepare
        </span>
      );
    case "MONITOR":
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
          Monitor
        </span>
      );
    case "NORMAL":
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
          Normal
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Not Analyzed
        </span>
      );
  }
}

