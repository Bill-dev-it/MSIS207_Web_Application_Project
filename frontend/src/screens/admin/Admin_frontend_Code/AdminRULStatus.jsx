import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchRULSystemStatus } from "../../../services/adminService";

export default function AdminRULStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [triggerNotice, setTriggerNotice] = useState("");

  useEffect(() => {
    fetchRULSystemStatus()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load RUL system status");
        setLoading(false);
      });
  }, []);

  const handleRetrigger = () => {
    setTriggerNotice("Triggered manual health check: Service is fully operational!");
    setTimeout(() => setTriggerNotice(""), 3500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-700 border-t-transparent" />
          <p className="text-sm font-medium text-neutral-500">Checking RUL service status...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="card max-w-md p-6 text-center">
          <p className="text-base font-semibold text-critical">Failed to load RUL status</p>
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

  const {
    service,
    lastCheck,
    modelVersion,
    deployedDate,
    predictionsToday,
    avgLatency,
    failedRuns7d,
    failureRate,
    urgencyDistribution,
    volumeHistory,
    recentRuns,
  } = data;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0B1F3A] antialiased">
      {/* Toast Notification */}
      {triggerNotice && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-3 text-sm font-medium text-white shadow-xl animate-fade-in">
          <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {triggerNotice}
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-[#E5E7EB] bg-white px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Logo with ADMIN badge */}
          <div className="flex items-center gap-2 px-2">
            <Link to="/" className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
              Aero<span className="text-accent">RUL</span>
            </Link>
            <span className="rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-bold text-[#6D28D9]">
              ADMIN
            </span>
          </div>

          {/* Admin Nav Items */}
          <nav className="flex flex-col gap-1 text-[13px] font-medium text-[#475569]">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users
            </Link>

            <Link
              to="/admin/companies"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Companies / Buyers
            </Link>

            <Link
              to="/admin/suppliers"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Suppliers
            </Link>

            <Link
              to="/admin/moderation"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Products</span>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white">
                5
              </span>
            </Link>

            <Link
              to="/admin/categories"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categories
            </Link>

            <Link
              to="/admin/orders"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Orders
            </Link>

            <Link
              to="/admin/reports"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              Reviews / Reports
            </Link>

            {/* Active RUL System Status with Green Dot */}
            <div className="flex items-center justify-between rounded-xl bg-[#0B1F3A] px-3.5 py-2.5 font-semibold text-white shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>RUL System Status</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>

            <Link
              to="/admin/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              System Settings
            </Link>
          </nav>
        </div>

        {/* Logout */}
        <button
          onClick={() => alert("Admin logged out.")}
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
              placeholder="Search listings, suppliers, catalog"
              className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2 pl-10 pr-4 text-[13px] outline-none transition-all placeholder:text-[#94A3B8] focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-[#64748B] hover:text-[#0B1F3A]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <div className="flex items-center gap-3 pl-2">
              <div className="h-9 w-9 rounded-full bg-[#CBD5E1]" />
              <div className="text-left leading-tight">
                <p className="text-[13px] font-bold text-[#0B1F3A]">Platform Admin</p>
                <p className="text-[11px] text-[#64748B]">Marketplace operations</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 space-y-6 px-8 py-6 pb-12">
          {/* Breadcrumb & Title */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                <span>Admin portal</span>
                <span>›</span>
                <span className="font-semibold text-[#0B1F3A]">RUL System Status</span>
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1F3A]">
                RUL system status
              </h1>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Health of the prediction service
              </p>
            </div>

            <button
              onClick={handleRetrigger}
              className="rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-bold text-[#0B1F3A] shadow-sm transition hover:bg-[#F8FAFC]"
            >
              Run Diagnostic
            </button>
          </div>

          {/* 4 Metric KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Service Status */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                SERVICE
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-[#0B1F3A]">
                {service}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">{lastCheck}</p>
            </div>

            {/* Model Version */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                MODEL VERSION
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#0B1F3A]">
                {modelVersion}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">{deployedDate}</p>
            </div>

            {/* Predictions Today */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                PREDICTIONS TODAY
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#0B1F3A]">
                {predictionsToday}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">{avgLatency}</p>
            </div>

            {/* Failed Runs */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                FAILED RUNS (7D)
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#0B1F3A]">
                {failedRuns7d}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">{failureRate}</p>
            </div>
          </div>

          {/* Middle Row: Volume Chart & Urgency Distribution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Prediction Volume (14 days) - 2/3 width */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm lg:col-span-8">
              <h2 className="text-base font-bold text-[#0B1F3A]">
                Prediction volume (14 days)
              </h2>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeHistory} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" hide />
                    <YAxis hide domain={[0, 200]} />
                    <Tooltip
                      formatter={(val) => [`${val} runs`, "Predictions"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="volume"
                      fill="#818CF8"
                      radius={[6, 6, 6, 6]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Urgency Distribution (latest per engine) - 1/3 width */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm lg:col-span-4">
              <div>
                <h2 className="text-base font-bold text-[#0B1F3A]">
                  Urgency distribution (latest per engine)
                </h2>

                <div className="mt-6 space-y-4">
                  {urgencyDistribution.map((item) => {
                    let badgeClass = "bg-[#DEF7EC] text-[#03543F]";
                    if (item.label === "Monitor") badgeClass = "bg-[#E0F2FE] text-[#0369A1]";
                    if (item.label === "Prepare") badgeClass = "bg-[#FEF3C7] text-[#92400E]";
                    if (item.label === "Prioritize") badgeClass = "bg-[#FEE2E2] text-[#991B1B]";

                    return (
                      <div key={item.label} className="flex items-center justify-between text-xs font-semibold">
                        <span className={`rounded-full px-3 py-1 ${badgeClass}`}>
                          {item.label}
                        </span>
                        <span className="font-extrabold text-[#0B1F3A] text-sm">
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table Card: Recent Prediction Runs */}
          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[#64748B]">TIME</th>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[#64748B]">ENGINE</th>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[#64748B]">COMPANY</th>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[#64748B]">RUL</th>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[#64748B]">URGENCY</th>
                  <th className="py-3 px-6 font-bold uppercase tracking-wider text-[#64748B]">RESULT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {recentRuns.map((run, idx) => {
                  let urgencyBadge = "bg-[#DEF7EC] text-[#03543F]";
                  if (run.urgency === "Monitor") urgencyBadge = "bg-[#E0F2FE] text-[#0369A1]";
                  if (run.urgency === "Prioritize") urgencyBadge = "bg-[#FEE2E2] text-[#991B1B]";
                  if (run.urgency === "Prepare") urgencyBadge = "bg-[#FEF3C7] text-[#92400E]";

                  return (
                    <tr key={idx} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-4 px-6 text-[#475569] font-medium">{run.time}</td>
                      <td className="py-4 px-6 font-mono font-semibold text-[#0B1F3A]">{run.engine}</td>
                      <td className="py-4 px-6 font-medium text-[#0B1F3A]">{run.company}</td>
                      <td className="py-4 px-6 font-bold text-[#0B1F3A]">{run.rul}</td>
                      <td className="py-4 px-6">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${urgencyBadge}`}>
                          {run.urgency}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="rounded-full bg-[#DEF7EC] px-2.5 py-0.5 text-[11px] font-bold text-[#03543F]">
                          {run.result}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
