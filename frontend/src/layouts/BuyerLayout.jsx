import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../features/buyer/cart";
import RoleNavigation from "../components/common/RoleNavigation";

const NAV_ITEMS = [
  {
    to: "/buyer",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    match: (pathname) => pathname === "/buyer" || pathname === "/buyer/" || pathname === "/buyer/dashboard",
  },
  {
    to: "/buyer/engines",
    label: "My Engines",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    match: (pathname) => pathname.startsWith("/buyer/engines"),
  },
  {
    to: "/buyer/rul",
    label: "RUL Analysis",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    match: (pathname) => pathname.startsWith("/buyer/rul"),
  },
  {
    to: "/marketplace",
    label: "Marketplace",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    match: (pathname) => pathname.startsWith("/marketplace"),
  },
  {
    to: "/cart",
    label: "Cart",
    badge: true,
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    match: (pathname) => pathname === "/cart" || pathname.startsWith("/checkout"),
  },
  {
    to: "/orders",
    label: "Orders",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    match: (pathname) => pathname.startsWith("/orders") || pathname.startsWith("/buyer/orders"),
  },
];

function getBreadcrumbTitle(pathname) {
  if (pathname.startsWith("/buyer/engines/")) {
    return "Engine Fleet Detail";
  }
  if (pathname.startsWith("/buyer/engines")) {
    return "My Fleet Engines";
  }
  if (pathname.startsWith("/buyer/rul")) {
    return "RUL Prediction & Analysis";
  }
  if (pathname.startsWith("/checkout")) {
    return "Procurement Checkout";
  }
  if (pathname === "/cart") {
    return "Procurement Cart";
  }
  if (pathname.startsWith("/orders/")) {
    return "Order Specification";
  }
  if (pathname.startsWith("/orders") || pathname.startsWith("/buyer/orders")) {
    return "Procurement Orders";
  }
  if (pathname.startsWith("/marketplace")) {
    return "Aviation Parts Marketplace";
  }
  return null;
}

export default function BuyerLayout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pathname = location.pathname;
  const subSectionTitle = getBreadcrumbTitle(pathname);

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle ESC key to dismiss mobile drawer
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

  const userInitials = (user?.full_name || "Buyer")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "B";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-[#0F172A]">
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (width ~240px, fixed left, white background #FFFFFF)    */}
      {/* ========================================================================= */}
      <aside
        aria-label="Buyer sidebar navigation"
        className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-30 bg-white text-slate-700 border-r border-[#E2E8F0]"
      >
        {/* Minimal AeroRUL Wordmark + BUYER Badge */}
        <div className="h-16 flex items-center px-5 border-b border-[#E2E8F0] shrink-0">
          <Link to="/buyer" className="flex items-center gap-2.5 focus:outline-hidden">
            <span className="text-[23px] font-bold tracking-tight">
              <span className="text-[#0B1F3A]">Aero</span>
              <span className="text-[#2D9CDB]">RUL</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#1D4ED8] border border-blue-100">
              BUYER
            </span>
          </Link>
        </div>

        {/* Main Navigation Links */}
        <nav aria-label="Buyer navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {itemCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Compact User & Sign Out (White Sidebar Theme) */}
        <div className="p-3 border-t border-[#E2E8F0] shrink-0 bg-white">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200 shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate" title={user?.full_name || "Buyer Account"}>
                {user?.full_name || "Buyer Account"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.company_name || "Fleet Operator"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            aria-label="Sign out of Buyer Portal"
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
      {/* 2. TOP HEADER (Sticky across all screens)                                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] lg:pl-60">
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Contextual Location */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Hamburger (Visible < lg) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Clean Breadcrumb (No duplicate H1 text) */}
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                Buyer Workspace
              </span>
              {subSectionTitle && (
                <>
                  <span className="text-slate-300 shrink-0">/</span>
                  <span className="text-slate-500 font-medium truncate">{subSectionTitle}</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Role Navigation & Account Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Role Switcher */}
            <div className="hidden md:block">
              <RoleNavigation />
            </div>

            {/* Cart shortcut (compact pill) */}
            <Link
              to="/cart"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              title="Shopping Cart"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              <span className="bg-[#0B1F3A] text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums">
                {itemCount}
              </span>
            </Link>

            {/* User Pill / Status */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                {userInitials}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-32 truncate hidden xl:inline">
                {user?.full_name || "Buyer"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE NAVIGATION DRAWER (< lg) (White Theme matching Desktop)          */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" id="mobile-navigation-drawer" role="dialog" aria-modal="true">
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
                <Link to="/buyer" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                  <span className="text-[22px] font-bold tracking-tight">
                    <span className="text-[#0B1F3A]">Aero</span>
                    <span className="text-[#2D9CDB]">RUL</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#1D4ED8] border border-blue-100">
                    BUYER
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
              <nav aria-label="Mobile navigation" className="mt-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <Link
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
                        <span className={active ? "text-white" : "text-[#64748B]"}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {itemCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Role Switcher Links */}
              <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
                  Portal Navigation
                </p>
                <div className="px-1">
                  <RoleNavigation />
                </div>
              </div>
            </div>

            {/* Drawer Bottom / User & Sign out */}
            <div className="pt-4 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-3 px-2 py-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user?.full_name || "Buyer Account"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.company_name || "Fleet Operator"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-[#F1F5F9] border border-slate-200 transition-colors"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{isLoggingOut ? "Signing out…" : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN WORKSPACE CONTENT CONTAINER                                       */}
      {/* ========================================================================= */}
      <div className="lg:pl-60 flex-1 flex flex-col">
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
