import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AccountActions from "../components/common/AccountActions";
import RoleNavigation from "../components/common/RoleNavigation";
import { NAVIGATION_CONFIG } from "../config/navigationConfig";

function SidebarIcon({ name, active }) {
  const colorClass = active ? "h-4 w-4 text-white" : "h-4 w-4";
  const strokeWidth = active ? 2 : 1.8;

  switch (name) {
    case "dashboard":
      return (
        <svg className={colorClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      );
    case "users":
      return (
        <svg className={colorClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    case "companies":
      return (
        <svg className={colorClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      );
    case "suppliers":
      return (
        <svg className={colorClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      );
    case "products":
      return (
        <svg className={colorClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      );
    case "orders":
      return (
        <svg className={colorClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      );
    case "reports":
      return (
        <svg className={colorClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
          />
        </svg>
      );
    case "rulStatus":
      return (
        <svg className={colorClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
    case "settings":
      return (
        <svg className={colorClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const adminNavItems = NAVIGATION_CONFIG.ADMIN || [];

  const isNavItemActive = (item) => {
    const currentPath = location.pathname;
    if (Array.isArray(item.matchPaths) && item.matchPaths.length > 0) {
      return item.matchPaths.some(
        (p) => currentPath === p || (p !== "/admin" && currentPath.startsWith(`${p}/`))
      );
    }
    return currentPath === item.path;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const isLandingPage =
    location.pathname === "/admin" || location.pathname === "/admin/";

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0B1F3A] antialiased">
      {/* Global Navigation Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <Link to="/admin" className="text-lg font-bold text-primary-800">
            Admin Portal
          </Link>
          <RoleNavigation />
          <AccountActions />
        </div>
      </header>

      {isLandingPage ? (
        <div className="w-full flex-1">
          <Outlet />
        </div>
      ) : (
        <div className="flex flex-1">
          {/* Shared Admin Sidebar Navigation */}
          <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-[#E5E7EB] bg-white px-4 py-6">
            <div className="flex flex-col gap-6">
              {/* Logo with ADMIN badge */}
              <div className="flex items-center gap-2 px-2">
                <Link
                  to="/admin"
                  className="text-2xl font-bold tracking-tight text-[#0B1F3A]"
                >
                  Aero<span className="text-accent">RUL</span>
                </Link>
                <span className="rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-bold text-[#6D28D9]">
                  ADMIN
                </span>
              </div>

              {/* Admin Nav Items */}
              <nav className="flex flex-col gap-1 text-[13px] font-medium text-[#475569]">
                {adminNavItems.map((item) => {
                  const active = isNavItemActive(item);
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "flex items-center justify-between rounded-xl bg-[#0B1F3A] px-3.5 py-2.5 font-semibold text-white shadow-sm"
                          : "flex items-center justify-between rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
                      }
                    >
                      <div className="flex items-center gap-3">
                        <SidebarIcon name={item.icon} active={active} />
                        <span>{item.label}</span>
                      </div>
                      {item.showStatusDot && (
                        <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </button>
          </aside>

          {/* Main Content Area */}
          <div className="flex min-w-0 flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      )}
    </div>
  );
}
