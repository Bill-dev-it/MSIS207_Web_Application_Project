import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070D18] flex items-center justify-center p-6 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-[#0D1829] border border-cyan-500/20 rounded-2xl p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500"></div>

        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-5 text-cyan-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-3">
          NAV-SYS: 404 ROUTE NOT LOCATED
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Waypoint Missing</h1>
        <p className="text-sm text-slate-400 mb-6">
          The requested coordinate or flight path does not exist in the AeroRUL registry. It may have been relocated or decommissioned.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-sm font-medium transition-all"
          >
            ← Return to Last Fix
          </button>
          <Link
            to="/"
            className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20"
          >
            Marketplace Home
          </Link>
        </div>
      </div>
    </div>
  );
}
