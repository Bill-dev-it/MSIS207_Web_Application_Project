import { Link, useNavigate } from "react-router-dom";

export default function Forbidden({ userRole, allowedRoles = [] }) {
  const navigate = useNavigate();

  const getPortalHome = () => {
    if (userRole === "BUYER") return "/buyer";
    if (userRole === "ADMIN") return "/admin";
    if (userRole === "SUPPLIER") return "/supplier";
    return "/";
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex items-center justify-center p-6 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-[#0D1829] border border-red-500/30 rounded-2xl p-8 shadow-2xl shadow-red-950/20 backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5 text-red-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            SECURITY CLEARANCE: 403 FORBIDDEN
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Access Restricted</h1>
          <p className="text-sm text-slate-400 mb-6">
            Your current account role <span className="font-mono text-cyan-400 font-semibold">[{userRole || "ANONYMOUS"}]</span> does not possess the clearance level required for this sector (Requires: {allowedRoles.join(" or ")}).
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-sm font-medium transition-all"
            >
              Go Back
            </button>
            <Link
              to={getPortalHome()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 text-center"
            >
              My Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
