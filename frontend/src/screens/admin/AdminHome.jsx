import { Link } from "react-router-dom";

export default function AdminHome() {
  const adminScreens = [
    {
      title: "Operations Dashboard",
      description: "Aggregated aviation marketplace health, active fleet metrics, catalog moderation backlog, and trading volume.",
      to: "/admin/dashboard",
      badge: "MISSION CONTROL",
      accent: "cyan",
    },
    {
      title: "Supplier & Part Moderation",
      description: "Inspect compliance tags, 8130-3 airworthiness certificates, pricing reasonableness, and approve/reject listings.",
      to: "/admin/moderation",
      badge: "GATEKEEPER",
      accent: "amber",
    },
    {
      title: "Predictive RUL Diagnostics",
      description: "Monitor C-MAPSS predictive inference server latency, probe system health, and inspect degradation forecasts.",
      to: "/admin/rul-status",
      badge: "AI TELEMETRY",
      accent: "purple",
    },
    {
      title: "Replacement Recommendations",
      description: "Automated engine-to-part matching based on RUL cycle threshold and FAA component interchangeability.",
      to: "/admin/recommendations",
      badge: "PROCUREMENT",
      accent: "emerald",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
            AERORUL ADMINISTRATION CONSOLE
          </span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white mt-1">
          Aviation Platform Management
        </h1>
        <p className="text-sm text-slate-400 font-sans mt-1">
          Centralized administrative governance backed by FAA Gold engine registries and PostgreSQL audit logging.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminScreens.map((screen) => (
          <Link
            key={screen.to}
            to={screen.to}
            className="p-6 rounded-2xl bg-[#091024] border border-slate-800 hover:border-cyan-500/50 shadow-xl transition-all duration-200 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700/60 group-hover:border-cyan-500/30 group-hover:text-cyan-300 transition">
                  {screen.badge}
                </span>
                <span className="text-slate-500 group-hover:text-cyan-400 font-mono transition">→</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-4 group-hover:text-cyan-400 transition">
                {screen.title}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-2 font-sans">
                {screen.description}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Path: {screen.to}</span>
              <span className="text-cyan-400 font-semibold">Open Console</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
