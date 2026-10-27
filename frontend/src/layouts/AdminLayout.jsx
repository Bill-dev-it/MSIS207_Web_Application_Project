import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ADMIN_NAV } from "../config/navigation";
import { TechIcon } from "../components/common/TechIcons";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

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
    if (location.pathname === "/admin" || location.pathname === "/admin/dashboard") return "Mission Control Dashboard";
    if (location.pathname.startsWith("/admin/moderation")) return "Part Moderation & Compliance";
    if (location.pathname.startsWith("/admin/rul-status")) return "RUL Telemetry & Service Health";
    if (location.pathname.startsWith("/admin/recommendations")) return "Recommendation Engine Pipeline";
    if (location.pathname.startsWith("/admin/users")) return "Authorized Operator Directory";
    if (location.pathname.startsWith("/admin/companies")) return "Registered Aviation Companies";
    if (location.pathname.startsWith("/admin/suppliers")) return "Approved Suppliers Network";
    return "Admin Oversight Portal";
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0B132B]/85 border-r border-slate-800/80 backdrop-blur-xl flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-red-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-red-500/20">
              ⚡
            </div>
            <span className="font-mono font-black text-lg tracking-tight text-white">
              Aero<span className="text-amber-400">ADMIN</span>
            </span>
          </Link>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-red-500/10 text-red-300 border border-red-500/30">
            Root
          </span>
        </div>

        {/* System state indicator */}
        <div className="p-4 border-b border-slate-800/60 bg-[#091024]/50">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
            Platform Infrastructure
          </div>
          <div className="text-xs font-mono text-emerald-400 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>SYSTEM MONITORING ONLINE</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Control Centers
          </div>
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500/20 to-red-500/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`
              }
            >
              <TechIcon name={item.icon} className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-4 pb-1.5 px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Ecosystem Registry
          </div>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-800 text-amber-300"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`
            }
          >
            <span>Users Registry</span>
          </NavLink>
          <NavLink
            to="/admin/companies"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-800 text-amber-300"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`
            }
          >
            <span>Companies Registry</span>
          </NavLink>
          <NavLink
            to="/admin/suppliers"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-800 text-amber-300"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`
            }
          >
            <span>Suppliers Network</span>
          </NavLink>
        </nav>

        {/* User footer & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-[#091024]/70 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || "Platform Admin"}</div>
            <div className="text-[11px] text-slate-400 truncate font-mono">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Terminate session"
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
            <span className="text-slate-400 text-xs font-mono">ADMIN-SYS //</span>
            <h1 className="text-base font-semibold text-white tracking-tight">{getBreadcrumbTitle()}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>ENVIRONMENT: PROD-GOLD</span>
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
