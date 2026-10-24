import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchReplacementRecommendations } from "../../../services/adminService";

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState(["top"]);
  const [cartNotification, setCartNotification] = useState("");
  const [compareList, setCompareList] = useState(["top", "optB", "optC"]);

  useEffect(() => {
    fetchReplacementRecommendations("ENG-037")
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load recommendations");
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (itemTitle, price) => {
    setCartNotification(`Added "${itemTitle}" to cart!`);
    setTimeout(() => setCartNotification(""), 3500);
  };

  const toggleSelect = (key) => {
    if (selectedItems.includes(key)) {
      setSelectedItems(selectedItems.filter((i) => i !== key));
    } else {
      setSelectedItems([...selectedItems, key]);
    }
  };

  const toggleCompare = (key) => {
    if (compareList.includes(key)) {
      setCompareList(compareList.filter((k) => k !== key));
    } else {
      setCompareList([...compareList, key]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-700 border-t-transparent" />
          <p className="text-sm font-medium text-neutral-500">Loading recommendations for ENG-037...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="card max-w-md p-6 text-center">
          <p className="text-base font-semibold text-critical">Failed to load recommendations</p>
          <p className="mt-2 text-sm text-neutral-500">{error || "No data available."}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { topRecommendation, alternatives } = data;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0B1F3A] antialiased">
      {/* Toast Notification */}
      {cartNotification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-3 text-sm font-medium text-white shadow-xl animate-fade-in">
          <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {cartNotification}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-[#E5E7EB] bg-white px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Brand Logo */}
          <Link to="/" className="px-2 text-2xl font-bold tracking-tight text-[#0B1F3A]">
            Aero<span className="text-accent">RUL</span>
          </Link>

          {/* Fleet Status Badge */}
          <div className="rounded-xl bg-[#EEF4FB] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">FLEET STATUS</p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1F3A]">24 engines active</p>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 text-[13px] font-medium text-[#475569]">
            <Link
              to="/buyer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>

            <Link
              to="/marketplace"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Marketplace
            </Link>

            <Link
              to="/buyer/engines"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              My Engines
            </Link>

            <Link
              to="/buyer/rul-analysis"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              RUL Analysis
            </Link>

            {/* Active Link */}
            <div className="flex items-center gap-3 rounded-xl bg-[#0B1F3A] px-3.5 py-2.5 font-semibold text-white shadow-sm">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Replacement Recommendations</span>
            </div>

            <Link
              to="/buyer/wishlist"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Wishlist
            </Link>

            <Link
              to="/buyer/orders"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Orders
            </Link>

            <Link
              to="/buyer/notifications"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications
            </Link>

            <Link
              to="/buyer/company"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company Profile
            </Link>

            <Link
              to="/buyer/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account Settings
            </Link>
          </nav>
        </div>

        {/* Logout */}
        <button
          onClick={() => alert("Logged out successfully.")}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-8">
          <div className="relative w-full max-w-lg">
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search Part Number, Engine Model, or Supplier"
              className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2 pl-10 pr-4 text-[13px] outline-none transition-all placeholder:text-[#94A3B8] focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>

          <div className="flex items-center gap-5">
            {/* Bell Icon */}
            <button className="relative text-[#64748B] hover:text-[#0B1F3A]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Cart Icon with badge */}
            <button className="relative text-[#64748B] hover:text-[#0B1F3A]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0B1F3A] text-[10px] font-bold text-white">
                2
              </span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2">
              <div className="h-9 w-9 rounded-full bg-[#CBD5E1]" />
              <div className="text-left leading-tight">
                <p className="text-[13px] font-bold text-[#0B1F3A]">John Doe</p>
                <p className="text-[11px] text-[#64748B]">Demo Horizon Airlines</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 space-y-6 px-8 py-6 pb-24">
          {/* Top Context Engine Banner */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <span className="text-[#64748B]">Based on</span>
                <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 font-mono text-xs font-semibold text-[#0B1F3A]">
                  {data.engineId}
                </span>
                <span className="font-semibold text-[#0B1F3A]">{data.engineModel}</span>
                <span className="text-[#94A3B8]">·</span>
                <span className="text-[#475569]">Predicted RUL</span>
                <span className="font-bold text-[#DC2626]">{data.predictedRul} cycles</span>
                <span className="rounded-md bg-[#FEE2E2] px-2 py-0.5 text-xs font-semibold text-[#DC2626]">
                  {data.urgency}
                </span>
              </div>

              <Link
                to="/buyer/engines"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
              >
                <span>←</span> Back to My Engines
              </Link>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#64748B]">
              {data.contextMessage}
            </p>
          </section>

          {/* Top Recommendation (Rank #1) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#0B1F3A] px-3 py-1 text-xs font-semibold text-white">
                Top recommendation · Rank #{topRecommendation.rank}
              </span>
              <span className="rounded-full bg-[#DEF7EC] px-3 py-1 text-xs font-semibold text-[#03543F]">
                Compatible
              </span>
            </div>

            <div className="rounded-2xl border-2 border-[#0B1F3A] bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Product Graphic Illustration */}
                <div className="flex items-center justify-center rounded-2xl bg-[#EEF2F6] p-4 lg:col-span-5">
                  <div className="relative flex h-52 w-full max-w-[320px] items-center justify-center">
                    <svg viewBox="0 0 320 200" className="h-full w-full" fill="none">
                      {/* Base stand */}
                      <rect x="25" y="145" width="270" height="28" rx="6" fill="#1E293B" />
                      <rect x="235" y="152" width="45" height="14" rx="3" fill="#E2E8F0" />

                      {/* Stage 1 Blades (5 Aerodynamic Turbine Blades) */}
                      {/* Blade 1 */}
                      <path d="M 45 145 C 40 100, 50 45, 62 30 C 74 45, 84 100, 79 145 Z" fill="url(#bladeGrad)" stroke="#94A3B8" strokeWidth="1.5" />
                      <path d="M 62 30 Q 64 90 62 145" stroke="#CBD5E1" strokeWidth="1.2" opacity="0.8" />

                      {/* Blade 2 */}
                      <path d="M 95 145 C 90 95, 100 40, 112 25 C 124 40, 134 95, 129 145 Z" fill="url(#bladeGrad)" stroke="#94A3B8" strokeWidth="1.5" />
                      <path d="M 112 25 Q 114 85 112 145" stroke="#CBD5E1" strokeWidth="1.2" opacity="0.8" />

                      {/* Blade 3 (Center) */}
                      <path d="M 145 145 C 140 90, 150 35, 162 20 C 174 35, 184 90, 179 145 Z" fill="url(#bladeGrad)" stroke="#94A3B8" strokeWidth="1.5" />
                      <path d="M 162 20 Q 164 80 162 145" stroke="#CBD5E1" strokeWidth="1.2" opacity="0.8" />

                      {/* Blade 4 */}
                      <path d="M 195 145 C 190 95, 200 40, 212 25 C 224 40, 234 95, 229 145 Z" fill="url(#bladeGrad)" stroke="#94A3B8" strokeWidth="1.5" />
                      <path d="M 212 25 Q 214 85 212 145" stroke="#CBD5E1" strokeWidth="1.2" opacity="0.8" />

                      {/* Blade 5 */}
                      <path d="M 245 145 C 240 100, 250 45, 262 30 C 274 45, 284 100, 279 145 Z" fill="url(#bladeGrad)" stroke="#94A3B8" strokeWidth="1.5" />
                      <path d="M 262 30 Q 264 90 262 145" stroke="#CBD5E1" strokeWidth="1.2" opacity="0.8" />

                      <defs>
                        <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="45%" stopColor="#E2E8F0" />
                          <stop offset="85%" stopColor="#CBD5E1" />
                          <stop offset="100%" stopColor="#94A3B8" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Product Meta & Actions */}
                <div className="flex flex-col justify-between space-y-4 lg:col-span-7">
                  <div className="space-y-3">
                    <span className="inline-block rounded-md bg-[#F1F5F9] px-2.5 py-1 font-mono text-xs font-semibold text-[#475569]">
                      P/N {topRecommendation.partNumber}
                    </span>

                    <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
                      {topRecommendation.title}
                    </h1>

                    {/* Supplier Row */}
                    <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] font-bold text-white text-xs">
                        {topRecommendation.supplier.initial}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#0B1F3A]">
                          {topRecommendation.supplier.name}
                        </span>
                        <svg className="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[#64748B]">·</span>
                        <span className="font-semibold text-[#D97706]">★ {topRecommendation.supplier.rating}</span>
                        <span className="text-[#64748B]">({topRecommendation.supplier.reviewsCount} reviews)</span>
                      </div>
                    </div>

                    {/* Spec Attributes Grid */}
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      <div className="rounded-xl bg-[#F8FAFC] p-2.5 text-center">
                        <p className="text-[11px] text-[#64748B]">Condition</p>
                        <p className="mt-0.5 text-xs font-bold text-[#0B1F3A]">{topRecommendation.condition}</p>
                      </div>
                      <div className="rounded-xl bg-[#F8FAFC] p-2.5 text-center">
                        <p className="text-[11px] text-[#64748B]">Stock</p>
                        <p className="mt-0.5 text-xs font-bold text-[#0B1F3A]">In stock ({topRecommendation.stock})</p>
                      </div>
                      <div className="rounded-xl bg-[#F8FAFC] p-2.5 text-center">
                        <p className="text-[11px] text-[#64748B]">Delivery</p>
                        <p className="mt-0.5 text-xs font-bold text-[#0B1F3A]">{topRecommendation.delivery}</p>
                      </div>
                      <div className="rounded-xl bg-[#F8FAFC] p-2.5 text-center">
                        <p className="text-[11px] text-[#64748B]">Warranty</p>
                        <p className="mt-0.5 text-xs font-bold text-[#0B1F3A]">{topRecommendation.warranty}</p>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="flex flex-wrap items-baseline justify-between gap-4 pt-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
                        ${topRecommendation.price.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">USD</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleSelect("top")}
                        className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-xs font-bold text-[#0B1F3A] transition hover:bg-[#F8FAFC]"
                      >
                        {selectedItems.includes("top") ? "Selected" : "View product"}
                      </button>

                      <button
                        onClick={() => handleAddToCart(topRecommendation.title, topRecommendation.price)}
                        className="rounded-xl bg-[#0B1F3A] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1E293B]"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Alternative Options Section */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-[#0B1F3A]">Alternative options</h2>
              <p className="text-xs text-[#64748B]">Other listings compatible with {data.engineModel}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {alternatives.map((opt, idx) => (
                <div
                  key={opt.partNumber}
                  className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#475569]">
                        {opt.optionKey} · Rank #{opt.rank}
                      </span>
                      <span className="rounded-full bg-[#DEF7EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#03543F]">
                        Compatible
                      </span>
                    </div>

                    <p className="font-mono text-[11px] text-[#64748B]">P/N {opt.partNumber}</p>
                    <h3 className="text-base font-bold text-[#0B1F3A]">{opt.title}</h3>

                    <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                      <span className="font-medium text-[#0B1F3A]">{opt.supplier.name}</span>
                      <svg className="h-3 w-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[#94A3B8]">·</span>
                      <span className="font-semibold text-[#D97706]">{opt.supplier.rating} rating</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs text-[#64748B]">
                      <span className="rounded-md bg-[#F8FAFC] px-2 py-1 font-medium">{opt.condition}</span>
                      <span className="rounded-md bg-[#F8FAFC] px-2 py-1 font-medium">In stock ({opt.stock})</span>
                      <span className="rounded-md bg-[#F8FAFC] px-2 py-1 font-medium">{opt.delivery}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-baseline justify-between pt-2">
                    <span className="text-xl font-extrabold text-[#0B1F3A]">
                      ${opt.price.toLocaleString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCompare(idx === 0 ? "optB" : "optC")}
                        className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-bold text-[#0B1F3A] transition hover:bg-[#F8FAFC]"
                      >
                        {compareList.includes(idx === 0 ? "optB" : "optC") ? "Compared" : "Add to compare"}
                      </button>

                      <button
                        onClick={() => handleAddToCart(opt.title, opt.price)}
                        className="rounded-xl bg-[#0B1F3A] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1E293B]"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Compare Options Table Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Compare options</h2>

            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                    <th className="py-3 px-5 font-bold uppercase tracking-wider text-[#64748B] w-1/4">
                      PARAMETER
                    </th>
                    <th className="py-3 px-5 font-bold uppercase tracking-wider text-[#0B1F3A] bg-[#F0F7FF] w-1/4">
                      TOP PICK · SAFRAN CERTIFIED
                    </th>
                    <th className="py-3 px-5 font-bold uppercase tracking-wider text-[#64748B] w-1/4">
                      OPTION B · DELTA TECHOPS
                    </th>
                    <th className="py-3 px-5 font-bold uppercase tracking-wider text-[#64748B] w-1/4">
                      OPTION C · GE AVIATION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  <tr>
                    <td className="py-3.5 px-5 font-medium text-[#64748B]">Price</td>
                    <td className="py-3.5 px-5 font-bold text-[#0B1F3A] bg-[#F0F7FF]">
                      {topRecommendation.specs.price}
                    </td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[0].specs.price}</td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[1].specs.price}</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 font-medium text-[#64748B]">Compatibility</td>
                    <td className="py-3.5 px-5 font-medium text-[#0B1F3A] bg-[#F0F7FF]">
                      {topRecommendation.specs.compatibility}
                    </td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[0].specs.compatibility}</td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[1].specs.compatibility}</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 font-medium text-[#64748B]">Stock</td>
                    <td className="py-3.5 px-5 font-medium text-[#0B1F3A] bg-[#F0F7FF]">
                      {topRecommendation.specs.stock}
                    </td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[0].specs.stock}</td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[1].specs.stock}</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 font-medium text-[#64748B]">Delivery</td>
                    <td className="py-3.5 px-5 font-medium text-[#0B1F3A] bg-[#F0F7FF]">
                      {topRecommendation.specs.delivery}
                    </td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[0].specs.delivery}</td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[1].specs.delivery}</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 font-medium text-[#64748B]">Condition</td>
                    <td className="py-3.5 px-5 font-medium text-[#0B1F3A] bg-[#F0F7FF]">
                      {topRecommendation.specs.condition}
                    </td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[0].specs.condition}</td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[1].specs.condition}</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-5 font-medium text-[#64748B]">Supplier rating</td>
                    <td className="py-3.5 px-5 font-medium text-[#0B1F3A] bg-[#F0F7FF]">
                      {topRecommendation.specs.supplierRating}
                    </td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[0].specs.supplierRating}</td>
                    <td className="py-3.5 px-5 text-[#0B1F3A]">{alternatives[1].specs.supplierRating}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Sticky Bottom Action Bar */}
        <footer className="fixed bottom-0 left-64 right-0 z-40 flex items-center justify-between border-t border-[#E5E7EB] bg-white px-8 py-3.5 shadow-lg">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#0B1F3A]">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>1 item selected</span>
            <span className="text-[#CBD5E1]">·</span>
            <span className="font-extrabold text-[#0B1F3A]">$62,400.00</span>
            <span className="text-[#CBD5E1]">·</span>
            <span className="font-medium text-[#475569]">{topRecommendation.title}</span>
          </div>

          <button
            onClick={() => handleAddToCart(topRecommendation.title, topRecommendation.price)}
            className="flex items-center gap-2 rounded-xl bg-[#0B1F3A] px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#1E293B]"
          >
            <span>Continue to cart</span>
            <span>→</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
