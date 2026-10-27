import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchBuyerEngines } from "../../../services/buyerService";
import { EngineFilterBar } from "../../../components/engine/EngineFilterBar";
import { EngineSparkline } from "../../../components/engine/EngineSparkline";
import { EngineDetailModal } from "../../../components/engine/EngineDetailModal";
import { StatusBadge } from "../../../components/ui/StatusBadge";

export default function MyEngines() {
  const [engines, setEngines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [manufacturerFilter, setManufacturerFilter] = useState("ALL");
  const [selectedEngine, setSelectedEngine] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchBuyerEngines();
        if (active) setEngines(data);
      } catch (err) {
        if (active) setError(err.message || "Failed to load engines fleet");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  const manufacturers = useMemo(() => {
    const set = new Set();
    engines.forEach((e) => {
      if (e.engineModel?.manufacturer) set.add(e.engineModel.manufacturer);
    });
    return Array.from(set);
  }, [engines]);

  const filteredEngines = useMemo(() => {
    return engines.filter((e) => {
      const matchSearch =
        !search ||
        e.engineCode?.toLowerCase().includes(search.toLowerCase()) ||
        e.serialNumber?.toLowerCase().includes(search.toLowerCase()) ||
        e.engineModel?.modelName?.toLowerCase().includes(search.toLowerCase());

      const matchUrgency =
        urgencyFilter === "ALL" || e.latestPrediction?.urgency === urgencyFilter;

      const matchMfg =
        manufacturerFilter === "ALL" ||
        e.engineModel?.manufacturer === manufacturerFilter;

      return matchSearch && matchUrgency && matchMfg;
    });
  }, [engines, search, urgencyFilter, manufacturerFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Fleet Propulsion Units</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Active inventory linked to registered aircraft with continuous telemetry streaming.
          </p>
        </div>
        <Link
          to="/buyer/recommendations"
          className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-2 transition"
        >
          <span>View All Replacement Recommendations →</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <EngineFilterBar
        search={search}
        onSearchChange={setSearch}
        urgencyFilter={urgencyFilter}
        onUrgencyChange={setUrgencyFilter}
        manufacturerFilter={manufacturerFilter}
        onManufacturerChange={setManufacturerFilter}
        manufacturers={manufacturers}
      />

      {/* Fleet Table */}
      <div className="bg-[#0D1829]/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#091024] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Engine ID</th>
                <th className="py-3.5 px-4">Model &amp; Manufacturer</th>
                <th className="py-3.5 px-4">Aircraft Mount</th>
                <th className="py-3.5 px-4">Cycle</th>
                <th className="py-3.5 px-4">Predicted RUL</th>
                <th className="py-3.5 px-4">Trend</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                      <span>Retrieving telemetry fleet records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-red-400">{error}</td>
                </tr>
              ) : filteredEngines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No propulsion units matching current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredEngines.map((eng) => (
                  <tr key={eng.engineId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-cyan-400">{eng.engineCode}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="text-white font-medium">{eng.engineModel?.modelName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{eng.engineModel?.manufacturer}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {eng.aircraft?.registrationNumber} <span className="text-slate-500">({eng.aircraft?.model})</span>
                    </td>
                    <td className="py-3.5 px-4 text-white font-bold">{eng.currentCycle}</td>
                    <td className="py-3.5 px-4">
                      {eng.latestPrediction?.predictedRul !== null ? (
                        <span className="font-bold text-amber-400">
                          {eng.latestPrediction.predictedRul} <span className="text-[10px] text-slate-500 font-normal">cycles</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <EngineSparkline data={eng.rulHistory} urgency={eng.latestPrediction?.urgency} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={eng.latestPrediction?.urgency} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEngine(eng)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-cyan-300 text-[11px] font-medium transition"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engine Detail Dossier Modal */}
      {selectedEngine && (
        <EngineDetailModal
          engine={selectedEngine}
          onClose={() => setSelectedEngine(null)}
        />
      )}
    </div>
  );
}
