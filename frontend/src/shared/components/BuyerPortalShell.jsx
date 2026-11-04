import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../features/buyer/cart/hooks/useCart";

/**
 * BuyerPortalShell
 * Shared layout component matching AeroRUL application design:
 * Left sidebar (navigation, fleet status, logout) + Top header (search, notifications, cart counter, profile)
 */
export default function BuyerPortalShell({ children, currentTab = "cart" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { cart } = useCart();

  const totalItems = cart?.total_items || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      <div className="flex flex-1">
        {/* ======================================================== */}
        {/* LEFT NAVIGATION SIDEBAR                                  */}
        {/* ======================================================== */}
        <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between flex-shrink-0 min-h-screen">
          <div>
            {/* AeroRUL Brand Logo */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <Link to="/" className="text-2xl font-black tracking-tight text-slate-900">
                Aero<span className="text-blue-600">RUL</span>
              </Link>
            </div>

            {/* Fleet Status Badge */}
            <div className="px-5 mt-5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                FLEET STATUS
              </p>
              <div className="mt-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-slate-700">
                  24 engines active
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="px-3 mt-5 space-y-1">
              <Link
                to="/buyer"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === "dashboard"
                    ? "bg-[#0B192C] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>

              <Link
                to="/engines"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === "engines"
                    ? "bg-[#0B192C] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                My Engines
              </Link>

              <Link
                to="/rul-analysis"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === "rul"
                    ? "bg-[#0B192C] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                RUL Analysis
              </Link>

              <Link
                to="/marketplace"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === "marketplace"
                    ? "bg-[#0B192C] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Marketplace
              </Link>

              <Link
                to="/orders"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === "orders"
                    ? "bg-[#0B192C] text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Orders
              </Link>
            </nav>
          </div>

          {/* Logout Footer */}
          <div className="p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors w-full px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN APPLICATION CONTAINER                               */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Bar */}
          <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between gap-6 sticky top-0 z-20">
            {/* Search Input Bar */}
            <div className="max-w-2xl w-full relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search Part Number, Engine Model, or Supplier"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    navigate(`/marketplace?search=${encodeURIComponent(e.target.value.trim())}`);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Actions & Avatar */}
            <div className="flex items-center gap-5 flex-shrink-0">
              {/* Notification Icon */}
              <button
                type="button"
                aria-label="Notifications"
                className="relative text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* Cart Icon with Live Counter */}
              <Link
                to="/cart"
                aria-label="Procurement Cart"
                className="relative text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100 block"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#0B192C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Profile Pill */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                  {(user?.email?.[0] || "J").toUpperCase()}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-xs font-bold text-slate-900">
                    {user?.email?.split("@")[0] || "John Doe"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Demo Horizon Airlines
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Child Page Content */}
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

