import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fetchAdminDashboard } from "../../../services/adminService";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto"></div>
        <p className="text-xs font-mono text-slate-400">Loading mission control dashboard metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs">
          {error || "Failed to load dashboard metrics"}
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold font-mono text-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { engines, listings, orders, suppliers, rulUrgencyDistribution, recentActivity } = data;

  const urgencyChartData = [
    { label: "Normal", count: rulUrgencyDistribution?.NORMAL || 0, color: "#10B981" },
    { label: "Monitor", count: rulUrgencyDistribution?.MONITOR || 0, color: "#0EA5E9" },
    { label: "Prepare", count: rulUrgencyDistribution?.PREPARE || 0, color: "#F59E0B" },
    { label: "Prioritize", count: rulUrgencyDistribution?.PRIORITIZE || 0, color: "#EF4444" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-emerald-400">
              OPERATIONS MISSION CONTROL · LIVE
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Executive Aviation Marketplace Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Aggregated telemetry, FAA engine registry statistics, supplier compliance, and trading liquidity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/moderation"
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5"
          >
            <span>Review Listings</span>
            {listings.pendingModeration > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-cyan-400 text-[10px]">
                {listings.pendingModeration}
              </span>
            )}
          </Link>
          <Link
            to="/admin/rul-status"
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition"
          >
            RUL Engine Status
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fleet Engines Card */}
        <div className="p-5 rounded-2xl bg-[#091024] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition"></div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>REGISTERED FLEET</span>
            <span className="text-cyan-400">Gold FAA</span>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            {engines.total}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Turbofan engines with active telemetry
          </div>
        </div>

        {/* Listings & Moderation Card */}
        <div className="p-5 rounded-2xl bg-[#091024] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition"></div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>ACTIVE CATALOG</span>
            <span className="text-amber-400">
              {listings.pendingModeration} Pending
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            {listings.total}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {listings.active} active · {listings.pendingModeration} awaiting decision
          </div>
        </div>

        {/* Orders & Volume Card */}
        <div className="p-5 rounded-2xl bg-[#091024] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition"></div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>TOTAL TRADING VOLUME</span>
            <span className="text-emerald-400">{orders.total} Orders</span>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            ${Number(orders.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Consignment transactions recorded
          </div>
        </div>

        {/* Verified Suppliers Card */}
        <div className="p-5 rounded-2xl bg-[#091024] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition"></div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SUPPLIER NETWORK</span>
            <span className="text-purple-400">Verified</span>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            {suppliers.total}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {suppliers.approved} approved aerospace distributors
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RUL Urgency Breakdown Chart */}
        <div className="p-6 rounded-2xl bg-[#091024] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Fleet RUL Urgency Distribution
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Current health distribution of operational aircraft engines
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              C-MAPSS
            </span>
          </div>

          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={urgencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1E293B", borderRadius: "8px", fontSize: "12px", color: "#F8FAFC" }}
                  formatter={(val) => [`${val} Engines`, "Count"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {urgencyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Directory Navigation Quick Jump */}
        <div className="p-6 rounded-2xl bg-[#091024] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              System Directory & Governance
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Live DB Tables</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              to="/admin/users"
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white">Users Directory</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">Admin & Buyer accounts</div>
              </div>
              <span className="text-cyan-400 font-mono text-xs">→</span>
            </Link>

            <Link
              to="/admin/companies"
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white">Companies Registry</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">Airlines & Operators (47)</div>
              </div>
              <span className="text-cyan-400 font-mono text-xs">→</span>
            </Link>

            <Link
              to="/admin/suppliers"
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white">Suppliers Registry</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">Aerospace vendors (40)</div>
              </div>
              <span className="text-cyan-400 font-mono text-xs">→</span>
            </Link>

            <Link
              to="/admin/recommendations"
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white">Recommendations</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">RUL replacement engine</div>
              </div>
              <span className="text-cyan-400 font-mono text-xs">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="p-6 rounded-2xl bg-[#091024] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Recent Administrative Audit Trail
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Cryptographically timestamped record of administrative and system operations
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">PostgreSQL Audit Logs</span>
        </div>

        {recentActivity && recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-800/60">
            {recentActivity.map((log) => (
              <div key={log.auditId} className="py-3 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <div>
                    <span className="text-white font-semibold">{log.action}</span>
                    <span className="text-slate-500 ml-2">
                      ({log.entityType} #{log.entityId})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                  <span>{log.actor?.name || "System Automated"}</span>
                  <span className="text-slate-500">
                    {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-500 py-4 text-center">
            No audit events logged yet.
          </p>
        )}
      </div>
    </div>
  );
}
