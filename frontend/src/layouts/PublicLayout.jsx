import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import AccountActions from "../components/common/AccountActions";

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] antialiased text-[#0F172A]">
      {/* Sticky White Public Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
          {/* Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2 focus:outline-hidden shrink-0"
            aria-label="AeroRUL Home"
          >
            <span className="text-[23px] font-bold tracking-tight">
              <span className="text-[#0B1F3A]">Aero</span>
              <span className="text-[#2D9CDB]">RUL</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
              MARKETPLACE
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Public navigation" className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#0B1F3A] text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/marketplace"
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#0B1F3A] text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
            >
              Marketplace
            </NavLink>
          </nav>

          {/* Right: Account Actions & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <AccountActions />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === "/"
                    ? "bg-[#0B1F3A] text-white font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Home
              </Link>
              <Link
                to="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname.startsWith("/marketplace")
                    ? "bg-[#0B1F3A] text-white font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Marketplace
              </Link>
            </nav>
            <div className="pt-3 border-t border-slate-100">
              <AccountActions />
            </div>
          </div>
        )}
      </header>

      {/* Main Public Content */}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* Professional Aviation B2B Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-[#0B1F3A]">Aero</span>
                  <span className="text-[#2D9CDB]">RUL</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  B2B PLATFORM
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                AI-Enhanced B2B Aviation Engine &amp; Parts E-Commerce Marketplace with Remaining Useful Life (RUL) replacement recommendations.
              </p>
              <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">
                Notice: AeroRUL is an educational university engineering project. Component catalog listings, compatibility models, and RUL predictions serve as decision-support demonstrations only.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Marketplace
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><Link to="/marketplace" className="hover:text-sky-700 transition-colors">Browse Catalog</Link></li>
                <li><Link to="/marketplace?category=Engine" className="hover:text-sky-700 transition-colors">Engine Components</Link></li>
                <li><Link to="/marketplace?category=Avionics" className="hover:text-sky-700 transition-colors">Avionics &amp; Sensors</Link></li>
                <li><Link to="/marketplace?category=Hydraulics" className="hover:text-sky-700 transition-colors">Hydraulic Actuation</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Portals &amp; Access
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><Link to="/login" className="hover:text-sky-700 transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-sky-700 transition-colors">Register Company</Link></li>
                <li><Link to="/buyer" className="hover:text-sky-700 transition-colors">Buyer Portal</Link></li>
                <li><Link to="/supplier" className="hover:text-sky-700 transition-colors">Supplier Portal</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} AeroRUL Project. All rights reserved.</p>
            <p className="font-mono text-[11px]">Academic Demo Version 1.0 &bull; B2B Procurement</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
