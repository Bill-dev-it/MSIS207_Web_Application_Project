import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated, redirect
  if (isAuthenticated && user) {
    const defaultTarget = user.role === "ADMIN" ? "/admin/dashboard" : "/buyer";
    navigate(returnTo || defaultTarget, { replace: true });
  }

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and access password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await login(email, password);
      const defaultTarget = loggedUser.role === "ADMIN" ? "/admin/dashboard" : "/buyer";
      navigate(returnTo || defaultTarget, { replace: true });
    } catch (err) {
      setError(err.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === "BUYER") {
      setEmail("buyer.horizon@demo.aerorul.test");
      setPassword("Demo@12345");
    } else if (role === "ADMIN") {
      setEmail("admin@demo.aerorul.test");
      setPassword("Demo@12345");
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex items-center justify-center p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background HUD Grid accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#0D1829]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl relative z-10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500"></div>

        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/25">
              ✈
            </div>
            <span className="text-2xl font-black tracking-tight text-white font-mono">
              Aero<span className="text-cyan-400">RUL</span>
            </span>
          </Link>
          <div className="text-xs font-mono tracking-widest text-slate-400 uppercase">
            Aviation B2B Fleet &amp; Marketplace Access
          </div>
        </div>

        {/* Quick demo sign-in shortcuts */}
        <div className="mb-6 p-3 rounded-2xl bg-[#091120] border border-cyan-500/20">
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center justify-between">
            <span>Demo Quick-Fill</span>
            <span className="text-[10px] text-slate-500">1-click test</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("BUYER")}
              className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Demo Buyer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("ADMIN")}
              className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Authorized E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. buyer.horizon@demo.aerorul.test"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[#091120] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-sm text-white font-mono placeholder:text-slate-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Security Key / Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-[#091120] border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-sm text-white font-mono placeholder:text-slate-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Authorizing...</span>
              </>
            ) : (
              <span>Establish Session →</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
            ← Return to Public Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
