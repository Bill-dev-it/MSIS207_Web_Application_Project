import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../../features/admin/services/adminApi";

function formatUsd(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatMonthLabel(monthStr) {
  if (!monthStr) return "";
  try {
    const [year, month] = monthStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return monthStr;
  }
}

export default function AdminDashboardLive() {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: "",
  });
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const response = await getAdminDashboard({
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setState({
            loading: false,
            data: response.data,
            error: "",
          });
          setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            loading: false,
            data: null,
            error: error.message || "Unable to load Admin dashboard.",
          });
        }
      }
    }

    loadDashboard();

    return () => controller.abort();
  }, [refreshCount]);

  function handleRefresh() {
    setState((previous) => ({
      ...previous,
      loading: true,
      error: "",
    }));
    setRefreshCount((count) => count + 1);
  }

  const data = state.data;

  // Calculate chart max for relative height scaling
  const maxTrendAmount = data?.sales_trend?.length
    ? Math.max(...data.sales_trend.map((item) => Number(item.total_usd) || 0), 1)
    : 1;

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADING                                                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Platform Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor marketplace activity, supplier approvals, payments and RUL service status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500 font-mono hidden md:inline">
              Last updated: {lastUpdated}
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={state.loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 text-slate-500 ${state.loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{state.loading ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {state.loading && !data && (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200" role="status">
          <div className="inline-block w-8 h-8 border-3 border-slate-200 border-t-[#0B1F3A] rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading marketplace overview data…</p>
        </div>
      )}

      {/* Error state */}
      {state.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800" role="alert">
          <div className="flex items-center gap-2 font-semibold">
            <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Failed to load platform data</span>
          </div>
          <p className="mt-1 ml-7">{state.error}</p>
        </div>
      )}

      {data && (
        <>
          {/* ========================================================================= */}
          {/* 2. PRIMARY KPI CARDS (4 Essential Metrics)                                */}
          {/* ========================================================================= */}
          <section aria-label="Key Performance Indicators">
            <h2 className="sr-only">Key Performance Indicators</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Buyer Accounts */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Buyer Accounts
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold font-mono text-slate-900">
                    {data.buyers ?? 0}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">Active registered buyers</p>
                </div>
              </div>

              {/* Approved Suppliers */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Approved Suppliers
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold font-mono text-slate-900">
                    {data.suppliers_approved ?? 0}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">Suppliers approved by admin</p>
                </div>
              </div>

              {/* Orders */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Procurement Orders
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold font-mono text-slate-900">
                    {data.orders_total ?? 0}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">Total lifetime orders created</p>
                </div>
              </div>

              {/* Succeeded Payment Volume */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    SUCCEEDED PAYMENT VOLUME
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 truncate block">
                    {formatUsd(data.succeeded_payment_volume_usd)}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">Includes simulated payments</p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. ATTENTION REQUIRED SECTION (Actionable Pending Items)                   */}
          {/* ========================================================================= */}
          <section aria-labelledby="attention-required-title" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 id="attention-required-title" className="text-base font-bold text-slate-900">
                  Attention Required
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Pending moderation queues</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pending Suppliers Card */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Supplier Approvals</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Supplier records awaiting administrator approval.
                    </p>
                  </div>
                  {data.suppliers_pending > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 shrink-0">
                      {data.suppliers_pending} Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 shrink-0">
                      0 Pending · Up to date
                    </span>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    {data.suppliers_pending > 0 ? `${data.suppliers_pending} application(s) queued` : "No pending suppliers"}
                  </span>
                  <Link
                    to="/admin/suppliers"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F3A] hover:text-[#2D9CDB] transition-colors"
                  >
                    <span>Review Suppliers</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Pending Bank Transfers Card */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Bank Transfer Verifications</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Offline bank transfer receipts awaiting manual administrator confirmation.
                    </p>
                  </div>
                  {data.payments_pending > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 shrink-0">
                      {data.payments_pending} Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 shrink-0">
                      0 Pending · All clear
                    </span>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    {data.payments_pending > 0 ? `${data.payments_pending} transfer(s) awaiting check` : "No pending transfers"}
                  </span>
                  <Link
                    to="/admin/payments"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1F3A] hover:text-[#2D9CDB] transition-colors"
                  >
                    <span>Manage Transfers</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 4. INVENTORY SUMMARY & RUL SYSTEM STATUS                                  */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Marketplace Inventory Summary */}
            <section aria-labelledby="inventory-summary-title" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h2 id="inventory-summary-title" className="text-base font-bold text-slate-900">
                    Marketplace Inventory Summary
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  Distinct breakdown of master catalog products and active supplier listings.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-medium text-slate-500 block">Active Products</span>
                    <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                      {data.products_active ?? 0}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">In master catalog</span>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-medium text-slate-500 block">Active Listings</span>
                    <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                      {data.listings_active ?? 0}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">Visible on marketplace</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Verified suppliers actively listing parts</span>
                <Link to="/marketplace" className="font-semibold text-sky-600 hover:text-sky-700">
                  Explore Catalog &rarr;
                </Link>
              </div>
            </section>

            {/* RUL System Status */}
            <section aria-labelledby="rul-status-title" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h2 id="rul-status-title" className="text-base font-bold text-slate-900">
                    RUL Prediction Service Status
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  Remaining Useful Life ML model registration and daily inference volume.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-medium text-slate-500 block">Registered Model</span>
                    <span className="text-lg font-bold font-mono text-slate-900 mt-1 block truncate" title={data.model_version || "Not registered"}>
                      {data.model_version || "Not registered"}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">Active ML checkpoint</span>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-medium text-slate-500 block">Inferences Today</span>
                    <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                      {data.predictions_today ?? 0}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">All prediction statuses</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>FastAPI endpoint status</span>
                <Link to="/admin/rul-health" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Check Service Health &rarr;
                </Link>
              </div>
            </section>
          </div>

          {/* ========================================================================= */}
          {/* 5. PAYMENT VOLUME TREND (6-Month Bar Chart)                               */}
          {/* ========================================================================= */}
          <section aria-labelledby="sales-trend-title" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <h2 id="sales-trend-title" className="text-base font-bold text-slate-900">
                  Succeeded Payment Volume (including simulation)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly trend for the trailing six months based on actual payment records.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
                Trailing 6 Months
              </span>
            </div>

            {Array.isArray(data.sales_trend) && data.sales_trend.length > 0 ? (
              <div>
                {/* Responsive Bar Chart Visual Container */}
                <div className="h-52 w-full pt-4 pb-2 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-200">
                  {data.sales_trend.map((row) => {
                    const amount = Number(row.total_usd) || 0;
                    const percentHeight = Math.max(Math.round((amount / maxTrendAmount) * 100), 2);

                    return (
                      <div
                        key={row.month}
                        className="flex-1 flex flex-col items-center justify-end h-full group"
                      >
                        {/* Amount tooltip above bar */}
                        <div className="text-[11px] font-mono font-semibold text-slate-700 mb-1 opacity-80 group-hover:opacity-100 transition-opacity truncate max-w-full text-center">
                          {formatUsd(amount)}
                        </div>

                        {/* Bar element */}
                        <div className="w-full max-w-[52px] bg-slate-100 rounded-t-md relative flex items-end h-full">
                          <div
                            style={{ height: `${percentHeight}%` }}
                            className="w-full bg-[#0B1F3A] group-hover:bg-[#2D9CDB] transition-all rounded-t-md shadow-2xs"
                          />
                        </div>

                        {/* Month Label below baseline */}
                        <span className="mt-2 text-xs font-medium text-slate-500 group-hover:text-slate-900 transition-colors text-center truncate w-full">
                          {formatMonthLabel(row.month)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footnote / Disclaimer */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>* Values reflect succeeded transactions across simulation and approved bank transfers.</span>
                  <span className="font-mono">Academic Demonstration</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-lg text-sm text-slate-500">
                No payment volume records available for the current period.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
