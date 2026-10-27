import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchBuyerEngines, fetchBuyerOrders, fetchBuyerRecommendations } from "../../services/buyerService";
import { TechIcon } from "../../components/common/TechIcons";
import { StatusBadge } from "../../components/ui/StatusBadge";

export default function BuyerHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEngines: 0,
    urgentEngines: 0,
    activeOrders: 0,
    recommendedParts: 0,
  });
  const [urgentList, setUrgentList] = useState([]);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [engines, ordersData, recs] = await Promise.all([
          fetchBuyerEngines(),
          fetchBuyerOrders({ pageSize: 5 }),
          fetchBuyerRecommendations(),
        ]);

        const urgent = engines.filter(
          (e) => e.latestPrediction?.urgency === "PRIORITIZE" || e.latestPrediction?.urgency === "PREPARE"
        );

        setStats({
          totalEngines: engines.length,
          urgentEngines: urgent.length,
          activeOrders: (ordersData.statusCounts?.CONFIRMED || 0) + (ordersData.statusCounts?.PROCESSING || 0) + (ordersData.statusCounts?.SHIPPED || 0),
          recommendedParts: recs.length,
        });

        setUrgentList(urgent.slice(0, 3));
      } catch (err) {
        // silent fallback
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Welcome Hero */}
      <div className="relative rounded-3xl bg-[#0D1829]/90 border border-slate-800 p-6 md:p-8 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            FLEET COMMAND CENTER ACTIVE
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
            Aviation Fleet &amp; Predictive Maintenance
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Real-time telemetry analytics, C-MAPSS Remaining Useful Life (RUL) projections, and certified spare part replenishment directly linked with Gold verified suppliers.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D1829]/80 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Fleet Engines</span>
            <TechIcon name="Engine" className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {loading ? <span className="animate-pulse">--</span> : stats.totalEngines}
          </div>
          <div className="mt-2 text-xs text-slate-400">Turbofan propulsion units</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1829]/80 border border-amber-500/20 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">MRO Alerts</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">
            {loading ? <span className="animate-pulse">--</span> : stats.urgentEngines}
          </div>
          <div className="mt-2 text-xs text-slate-400">Prepare / Prioritize status</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1829]/80 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Active PO Orders</span>
            <TechIcon name="Order" className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {loading ? <span className="animate-pulse">--</span> : stats.activeOrders}
          </div>
          <div className="mt-2 text-xs text-slate-400">Processing &amp; in-transit</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1829]/80 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Compatible Spares</span>
            <TechIcon name="Recommendation" className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {loading ? <span className="animate-pulse">--</span> : stats.recommendedParts}
          </div>
          <div className="mt-2 text-xs text-slate-400">Matched marketplace parts</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/buyer/engines"
          className="group p-6 rounded-2xl bg-[#0D1829]/70 border border-slate-800 hover:border-cyan-500/40 hover:bg-[#0F1C30] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <TechIcon name="Engine" className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
              Fleet &amp; RUL Telemetry
              <span className="text-cyan-400 text-xs group-hover:translate-x-1 transition-transform">→</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Review remaining useful life cycles, cycle burn rate, and historical sensor telemetry across all your Boeing and Airbus engines.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-cyan-400">
            <span>Explore 24 units</span>
            <span>View Telemetry →</span>
          </div>
        </Link>

        <Link
          to="/buyer/recommendations"
          className="group p-6 rounded-2xl bg-[#0D1829]/70 border border-slate-800 hover:border-amber-500/40 hover:bg-[#0F1C30] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <TechIcon name="Recommendation" className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
              AI Replacement Spares
              <span className="text-amber-400 text-xs group-hover:translate-x-1 transition-transform">→</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ranked spare parts filtered by engine compatibility, verified stock quantity, unit pricing and lead times from approved suppliers.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-amber-400">
            <span>Critical Engines</span>
            <span>Procure Spares →</span>
          </div>
        </Link>

        <Link
          to="/buyer/orders"
          className="group p-6 rounded-2xl bg-[#0D1829]/70 border border-slate-800 hover:border-blue-500/40 hover:bg-[#0F1C30] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <TechIcon name="Order" className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
              Purchase Orders Dossier
              <span className="text-blue-400 text-xs group-hover:translate-x-1 transition-transform">→</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track multi-supplier purchase shipments, inspect line items and air-waybill numbers, and contact suppliers directly.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-blue-400">
            <span>Dossier Archive</span>
            <span>View Orders →</span>
          </div>
        </Link>
      </div>

      {/* Urgent Maintenance Watchlist */}
      {urgentList.length > 0 && (
        <div className="rounded-2xl bg-[#0D1829]/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              Propulsion Units Requiring Immediate Requisition
            </h3>
            <Link to="/buyer/recommendations" className="text-xs text-cyan-400 hover:underline font-mono">
              View All Recommendations →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {urgentList.map((e) => (
              <div key={e.engineId} className="p-4 rounded-xl bg-[#091024] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400 font-mono">{e.engineCode}</span>
                    <StatusBadge status={e.latestPrediction?.urgency} />
                  </div>
                  <div className="text-sm font-semibold text-white">{e.engineModel?.modelName}</div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    Aircraft: {e.aircraft?.registrationNumber} ({e.aircraft?.model})
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Predicted RUL:</span>
                  <span className="text-amber-400 font-bold">{e.latestPrediction?.predictedRul} cycles</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
