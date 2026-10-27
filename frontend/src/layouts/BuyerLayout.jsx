import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BUYER_NAV } from "../config/navigation";
import { TechIcon } from "../components/common/TechIcons";
import { api } from "../services/apiClient";

export default function BuyerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // Poll or refresh cart count on route change
  useEffect(() => {
    let active = true;
    async function loadCartCount() {
      try {
        const data = await api.get("/buyer/cart");
        if (active && data) setCartCount(data.itemCount || 0);
      } catch (err) {
        // silent
      }
    }
    loadCartCount();
    return () => { active = false; };
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      navigate("/login", { replace: true });
    }
  };

  const getBreadcrumbTitle = () => {
    if (location.pathname === "/buyer") return "Fleet Command Overview";
    if (location.pathname.startsWith("/buyer/engines")) return "Fleet Engines & Telemetry";
    if (location.pathname.startsWith("/buyer/recommendations")) return "RUL Replacement Spares";
    if (location.pathname === "/buyer/orders") return "Purchase Orders";
    if (location.pathname.includes("/order-confirmation")) return "Order Confirmation";
    if (location.pathname.startsWith("/buyer/orders/")) return "Order Dossier Details";
    return "Buyer Portal";
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0B132B]/80 border-r border-slate-800/80 backdrop-blur-xl flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/buyer" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-cyan-500/20">
              ✈
            </div>
            <span className="font-mono font-black text-lg tracking-tight text-white">
              Aero<span className="text-cyan-400">RUL</span>
            </span>
          </Link>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Buyer
          </span>
        </div>

        {/* Company context chip */}
        <div className="p-4 border-b border-slate-800/60 bg-[#091024]/50">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
            Registered Operator
          </div>
          <div className="text-sm font-semibold text-white truncate" title={user?.companyName}>
            {user?.companyName || "Demo Horizon Airlines"}
          </div>
          <div className="text-xs text-cyan-400/80 font-mono flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Telemetry Link Active
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1">
          {BUYER_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`
              }
            >
              <TechIcon name={item.icon} className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-4 pb-2 px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            External Links
          </div>
          <NavLink
            to="/marketplace"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
          >
            <TechIcon name="Cart" className="w-4 h-4 text-slate-400" />
            <span>Public Catalog</span>
          </NavLink>
        </nav>

        {/* User footer & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-[#091024]/70 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || "Buyer"}</div>
            <div className="text-[11px] text-slate-400 truncate font-mono">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out of mission console"
            className="p-2 rounded-xl border border-slate-700/80 hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
          >
            <TechIcon name="Logout" className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0B132B]/60 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs font-mono">PORTAL //</span>
            <h1 className="text-base font-semibold text-white tracking-tight">{getBreadcrumbTitle()}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Cart shortcut */}
            <Link
              to="/buyer/orders"
              className="relative p-2 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-2 px-3 text-xs font-mono"
            >
              <TechIcon name="Cart" className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Quick role indicator */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
              <span className="font-mono text-[11px]">ROLE: BUYER</span>
            </div>
          </div>
        </header>

        {/* Screen Outlet */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#070D18] via-[#091124] to-[#070D18]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
