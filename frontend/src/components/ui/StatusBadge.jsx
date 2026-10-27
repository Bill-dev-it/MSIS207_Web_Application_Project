export function StatusBadge({ status, type = "urgency" }) {
  if (!status) return null;

  if (type === "urgency") {
    switch (status.toUpperCase()) {
      case "PRIORITIZE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30 glow-red">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            PRIORITIZE
          </span>
        );
      case "PREPARE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            PREPARE
          </span>
        );
      case "MONITOR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            MONITOR
          </span>
        );
      case "NORMAL":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            NORMAL
          </span>
        );
    }
  }

  // Order status
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-blue-500/10 text-blue-300 border border-blue-500/30">
          CONFIRMED
        </span>
      );
    case "PROCESSING":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
          PROCESSING
        </span>
      );
    case "SHIPPED":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30">
          IN TRANSIT
        </span>
      );
    case "DELIVERED":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          DELIVERED
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
          {status}
        </span>
      );
  }
}
