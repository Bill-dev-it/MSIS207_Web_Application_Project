import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const NAV_ITEMS = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    match: (pathname) => pathname === "/admin" || pathname === "/admin/" || pathname === "/admin/dashboard",
  },
  {
    to: "/admin/suppliers",
    label: "Supplier Approvals",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    match: (pathname) => pathname.startsWith("/admin/suppliers") || pathname.startsWith("/admin/moderation"),
  },
  {
    to: "/admin/payments",
    label: "Bank Transfers",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    match: (pathname) => pathname.startsWith("/admin/payments"),
  },
  {
    to: "/admin/rul-health",
    label: "RUL Health",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    match: (pathname) => pathname.startsWith("/admin/rul-health") || pathname.startsWith("/admin/rul-status"),
  },
];

function getBreadcrumbTitle(pathname) {
  if (pathname.startsWith("/admin/suppliers") || pathname.startsWith("/admin/moderation")) {
    return "Supplier Approvals";
  }
  if (pathname.startsWith("/admin/payments")) {
    return "Bank Transfers";
  }
  if (pathname.startsWith("/admin/rul-health") || pathname.startsWith("/admin/rul-status")) {
    return "RUL Health Monitoring";
  }
  return "Platform Overview";
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pathname = location.pathname;
  const currentTitle = getBreadcrumbTitle(pathname);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle ESC key to dismiss drawer
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  }

  const userInitials = (user?.full_name || "Admin")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-[#0F172A] overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#0B1F3A] focus:shadow-md focus:rounded-lg focus:border focus:border-slate-300"
      >
        Skip to main content
      </a>

      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (width ~264px, fixed left, white background)            */}
      {/* ========================================================================= */}
      <aside
        aria-label="Admin sidebar navigation"
        className="hidden lg:flex lg:flex-col lg:w-[264px] lg:fixed lg:inset-y-0 z-30 bg-white text-slate-700 border-r border-[#E2E8F0]"
      >
        {/* Minimal AeroRUL Wordmark + ADMIN Badge */}
        <div className="h-16 flex items-center px-5 border-b border-[#E2E8F0] shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 focus:outline-hidden">
            <span className="text-[23px] font-bold tracking-tight">
              <span className="text-[#0B1F3A]">Aero</span>
              <span className="text-[#2D9CDB]">RUL</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              ADMIN
            </span>
          </Link>
        </div>

        {/* Main Navigation Links */}
        <nav aria-label="Admin workspace navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between rounded-[10px] h-11 px-3.5 text-sm transition-colors ${
                  active
                    ? "bg-[#0B1F3A] text-white font-semibold shadow-xs"
                    : "bg-transparent text-[#334155] font-medium hover:bg-[#F1F5F9] hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={active ? "text-white" : "text-[#64748B]"}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Admin User & Sign Out */}
        <div className="p-3 border-t border-[#E2E8F0] shrink-0 bg-white">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200 shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate" title={user?.full_name || "Admin Account"}>
                {user?.full_name || "Administrator"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || "System Management"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            aria-label="Sign out of Admin Portal"
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-[#F1F5F9] border border-slate-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{isLoggingOut ? "Signing out…" : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. TOP HEADER (Sticky across all screens, offset by sidebar on lg)         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] lg:pl-[264px]">
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-mobile-drawer"
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                Admin Workspace
              </span>
              <span className="text-slate-300 shrink-0">/</span>
              <span className="text-slate-500 font-medium truncate">{currentTitle}</span>
            </div>
          </div>

          {/* Right: Public Link, User Avatar, Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Public Store shortcut */}
            <Link
              to="/marketplace"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              title="View Public Marketplace"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">Public Marketplace</span>
            </Link>

            {/* Admin User Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                {userInitials}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-36 truncate hidden sm:inline">
                {user?.full_name || "Administrator"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE NAVIGATION DRAWER (< lg)                                        */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" id="admin-mobile-drawer" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white text-slate-800 p-5 flex flex-col justify-between shadow-xl z-10 overflow-y-auto border-r border-[#E2E8F0]">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                  <span className="text-[22px] font-bold tracking-tight">
                    <span className="text-[#0B1F3A]">Aero</span>
                    <span className="text-[#2D9CDB]">RUL</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                    ADMIN
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer Nav Links */}
              <nav aria-label="Mobile admin navigation" className="mt-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-[10px] h-11 px-3.5 text-sm transition-colors ${
                        active
                          ? "bg-[#0B1F3A] text-white font-semibold"
                          : "bg-transparent text-[#334155] font-medium hover:bg-[#F1F5F9] hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={active ? "text-white" : "text-[#64748B]"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200 shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user?.full_name || "Administrator"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user?.email || "System Management"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-[#F1F5F9] border border-slate-200 transition-colors"
              >
                <span>{isLoggingOut ? "Signing out…" : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN PAGE CONTENT                                                      */}
      {/* ========================================================================= */}
      <main id="main-content" className="flex-1 lg:pl-[264px] min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
