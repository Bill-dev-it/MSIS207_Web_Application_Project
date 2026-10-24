import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBuyerEngines } from "../../../services/buyerService";

/**
 * Data Mapper: converts raw engine data to view-model
 */
function mapEngineToViewModel(raw) {
  return {
    id: raw.engine_id,
    code: raw.engine_code,
    serialNumber: raw.serial_number,
    model: raw.model_name,
    manufacturer: raw.manufacturer,
    family: raw.engine_family,
    type: raw.engine_type,
    aircraft: raw.aircraft_registration,
    aircraftModel: raw.aircraft_model,
    currentCycle: raw.current_cycle,
    predictedRul: raw.predicted_rul,
    maxCycleLife: raw.max_cycle_life || 2500,
    urgency: raw.urgency,
    lastAnalysis: raw.last_analysis_at
      ? new Date(raw.last_analysis_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Pending",
    operatingStatus: raw.operating_status,
    sensorUploads: raw.sensor_uploads || [],
  };
}

export default function MyEngines() {
  const [engines, setEngines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEngineId, setSelectedEngineId] = useState(37); // Defaults to ENG-037

  useEffect(() => {
    fetchBuyerEngines()
      .then((data) => {
        const mapped = data.map(mapEngineToViewModel);
        setEngines(mapped);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load buyer fleet engines");
        setLoading(false);
      });
  }, []);

  // Filter & Search Logic
  const filteredEngines = useMemo(() => {
    return engines.filter((eng) => {
      const matchesFilter =
        activeFilter === "ALL" || eng.urgency === activeFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        eng.code.toLowerCase().includes(q) ||
        eng.serialNumber.toLowerCase().includes(q) ||
        eng.model.toLowerCase().includes(q) ||
        eng.aircraft.toLowerCase().includes(q) ||
        eng.aircraftModel.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [engines, activeFilter, searchQuery]);

  // Counts by urgency
  const counts = useMemo(() => {
    return {
      all: engines.length,
      prioritize: engines.filter((e) => e.urgency === "PRIORITIZE").length,
      prepare: engines.filter((e) => e.urgency === "PREPARE").length,
      monitor: engines.filter((e) => e.urgency === "MONITOR").length,
      normal: engines.filter((e) => e.urgency === "NORMAL").length,
    };
  }, [engines]);

  // Currently selected engine object
  const selectedEngine = useMemo(() => {
    return (
      engines.find((e) => e.id === selectedEngineId) ||
      filteredEngines[0] ||
      engines[0]
    );
  }, [engines, selectedEngineId, filteredEngines]);

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "PRIORITIZE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
            PRIORITIZE
          </span>
        );
      case "PREPARE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            PREPARE
          </span>
        );
      case "MONITOR":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            MONITOR
          </span>
        );
      case "NORMAL":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            NORMAL
          </span>
        );
    }
  };

  const getRulBarColor = (urgency) => {
    switch (urgency) {
      case "PRIORITIZE":
        return "bg-rose-500";
      case "PREPARE":
        return "bg-amber-500";
      case "MONITOR":
        return "bg-sky-500";
      case "NORMAL":
      default:
        return "bg-emerald-500";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0B1F3A] border-t-transparent" />
          <p className="text-sm font-medium text-neutral-500">Loading buyer fleet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="card max-w-md p-6 text-center">
          <p className="text-base font-semibold text-rose-600">Failed to load engines</p>
          <p className="mt-2 text-sm text-neutral-500">{error}</p>
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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0B1F3A] antialiased">
      {/* Sidebar Navigation */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-[#E2E8F0] bg-white px-4 py-6 shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Brand Logo */}
          <Link to="/" className="px-2 text-2xl font-bold tracking-tight text-[#0B1F3A]">
            Aero<span className="text-accent">RUL</span>
          </Link>

          {/* Fleet Status Badge */}
          <div className="rounded-xl bg-[#EEF4FB] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">FLEET STATUS</p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1F3A]">{counts.all} engines active</p>
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

            {/* Active Link: My Engines */}
            <div className="flex items-center gap-3 rounded-xl bg-[#0B1F3A] px-3.5 py-2.5 font-semibold text-white shadow-sm">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>My Engines</span>
            </div>

            <Link
              to="/admin/rul-status"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              RUL Analysis
            </Link>

            <Link
              to="/buyer/recommendations"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Replacement Recommendations
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
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 border-t border-[#E2E8F0] pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">SWITCH WORKSPACE</span>
            <div className="flex items-center justify-between rounded-lg bg-[#F1F5F9] px-2.5 py-1.5 text-xs font-semibold text-[#0B1F3A]">
              <span>Demo Horizon Airlines</span>
              <svg className="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1F3A] font-bold text-white text-xs">
              DP
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-bold text-[#0B1F3A]">Demo Procurement 1</span>
              <span className="truncate text-[11px] text-[#64748B]">demo.buyer@horizon.aero</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-8">
          <div className="flex items-center gap-3 w-96">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#94A3B8]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search engines, aircraft, serial..."
                className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] py-1.5 pl-9 pr-3 text-xs text-[#0B1F3A] placeholder-[#94A3B8] transition focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/buyer/recommendations"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#132A4A] transition"
            >
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Replacement Recommendations
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {/* Header Title & Filter Tabs */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">My Engines</h1>
              <p className="mt-1 text-xs text-[#64748B]">
                Fleet overview · {counts.all} engines tracked · {counts.prioritize} requires priority action
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-4">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === "ALL"
                    ? "bg-[#0B1F3A] text-white shadow-sm"
                    : "bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
                }`}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setActiveFilter("PRIORITIZE")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === "PRIORITIZE"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white text-rose-700 hover:bg-rose-50 border border-rose-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Prioritize ({counts.prioritize})
              </button>
              <button
                onClick={() => setActiveFilter("PREPARE")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === "PREPARE"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Prepare ({counts.prepare})
              </button>
              <button
                onClick={() => setActiveFilter("MONITOR")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === "MONITOR"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-white text-sky-700 hover:bg-sky-50 border border-sky-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Monitor ({counts.monitor})
              </button>
              <button
                onClick={() => setActiveFilter("NORMAL")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === "NORMAL"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Normal ({counts.normal})
              </button>
            </div>
          </div>

          {/* Grid: Left Table (7 cols) + Right Detail Panel (5 cols) */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Engines List Table */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
                <div className="border-b border-[#E2E8F0] px-4 py-3 bg-[#F8FAFC] flex justify-between items-center">
                  <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                    Engine Fleet Registry ({filteredEngines.length})
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Click row to inspect engine</span>
                </div>

                {filteredEngines.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-neutral-500">No engines match your query.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                        <tr>
                          <th className="px-4 py-3">Engine ID</th>
                          <th className="px-3 py-3">Model</th>
                          <th className="px-3 py-3">Aircraft</th>
                          <th className="px-3 py-3 text-right">Cycle</th>
                          <th className="px-4 py-3">Latest RUL</th>
                          <th className="px-3 py-3">Urgency</th>
                          <th className="px-3 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {filteredEngines.map((eng) => {
                          const isSelected = eng.id === selectedEngine?.id;
                          return (
                            <tr
                              key={eng.id}
                              onClick={() => setSelectedEngineId(eng.id)}
                              className={`cursor-pointer transition hover:bg-[#F1F5F9] ${
                                isSelected ? "bg-[#EFF6FF] ring-1 ring-inset ring-accent/30 font-medium" : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-mono font-bold text-[#0B1F3A]">
                                {eng.code}
                                {isSelected && (
                                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                                )}
                              </td>
                              <td className="px-3 py-3 text-[#475569] font-medium">{eng.model}</td>
                              <td className="px-3 py-3 text-[#64748B]">
                                <div className="truncate max-w-[120px]" title={`${eng.aircraft} (${eng.aircraftModel})`}>
                                  {eng.aircraft}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-[#0B1F3A]">
                                {eng.currentCycle.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className="font-mono font-bold text-[#0B1F3A]">
                                    {eng.predictedRul} cycles
                                  </span>
                                  <div className="h-1.5 w-24 rounded-full bg-[#E2E8F0] overflow-hidden">
                                    <div
                                      className={`h-full ${getRulBarColor(eng.urgency)}`}
                                      style={{
                                        width: `${Math.min(100, Math.max(10, (eng.predictedRul / 150) * 100))}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">{getUrgencyBadge(eng.urgency)}</td>
                              <td className="px-3 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEngineId(eng.id);
                                  }}
                                  className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                                    isSelected
                                      ? "bg-[#0B1F3A] text-white"
                                      : "bg-[#F1F5F9] text-[#0B1F3A] hover:bg-[#E2E8F0]"
                                  }`}
                                >
                                  {isSelected ? "Active" : "Inspect"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Engine Detail & RUL Analysis Panel */}
            {selectedEngine && (
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Engine Card */}
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold font-mono text-[#0B1F3A]">
                          {selectedEngine.code}
                        </h2>
                        {getUrgencyBadge(selectedEngine.urgency)}
                      </div>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {selectedEngine.model} · {selectedEngine.manufacturer}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold uppercase text-[#94A3B8]">CURRENT CYCLE</span>
                      <p className="font-mono text-base font-bold text-[#0B1F3A]">
                        {selectedEngine.currentCycle.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Semicircular Gauge Card */}
                  <div className="mt-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      PREDICTED REMAINING USEFUL LIFE
                    </span>

                    <div className="my-4 flex flex-col items-center justify-center">
                      {/* SVG Gauge Graphic */}
                      <div className="relative flex items-center justify-center">
                        <svg className="h-36 w-48 overflow-visible" viewBox="0 0 200 110">
                          {/* Background Arc */}
                          <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="16"
                            strokeLinecap="round"
                          />
                          {/* Colored Arc value based on RUL */}
                          <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke={
                              selectedEngine.urgency === "PRIORITIZE"
                                ? "#E11D48"
                                : selectedEngine.urgency === "PREPARE"
                                ? "#D97706"
                                : selectedEngine.urgency === "MONITOR"
                                ? "#0284C7"
                                : "#10B981"
                            }
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeDasharray="251.2"
                            strokeDashoffset={
                              251.2 -
                              Math.min(
                                251.2,
                                Math.max(25, (selectedEngine.predictedRul / 150) * 251.2)
                              )
                            }
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute top-12 flex flex-col items-center">
                          <span className="font-mono text-4xl font-extrabold text-[#0B1F3A]">
                            {selectedEngine.predictedRul}
                          </span>
                          <span className="text-xs font-semibold text-[#64748B] uppercase">CYCLES</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#475569] leading-relaxed max-w-xs mx-auto">
                      {selectedEngine.urgency === "PRIORITIZE"
                        ? "Critical threshold reached. Immediate replacement scheduling recommended to prevent flight interruption."
                        : selectedEngine.urgency === "PREPARE"
                        ? "Engine entering pre-maintenance zone. Review procurement options within 30 days."
                        : "Operating within normal maintenance envelope."}
                    </p>

                    <Link
                      to={`/buyer/recommendations?engine=${selectedEngine.code}`}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1F3A] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#132A4A] transition"
                    >
                      <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      View replacement recommendations
                    </Link>
                  </div>

                  {/* Engine Specs Grid */}
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#E2E8F0] pt-4 text-xs">
                    <div>
                      <span className="text-[#94A3B8]">Serial Number</span>
                      <p className="font-mono font-bold text-[#0B1F3A]">{selectedEngine.serialNumber}</p>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Aircraft Tail</span>
                      <p className="font-bold text-[#0B1F3A]">{selectedEngine.aircraft}</p>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Aircraft Model</span>
                      <p className="font-medium text-[#0B1F3A]">{selectedEngine.aircraftModel}</p>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Last Analysis</span>
                      <p className="font-medium text-[#0B1F3A]">{selectedEngine.lastAnalysis}</p>
                    </div>
                  </div>
                </div>

                {/* Sensor Telemetry Uploads */}
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
                        Sensor Upload History
                      </h3>
                      <p className="text-[11px] text-[#64748B]">Recent telemetry files uploaded for this engine</p>
                    </div>
                    <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
                      {selectedEngine.sensorUploads.length} files
                    </span>
                  </div>

                  {selectedEngine.sensorUploads.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#94A3B8]">
                      No custom telemetry files uploaded yet.
                    </div>
                  ) : (
                    <div className="mt-3 divide-y divide-[#F1F5F9]">
                      {selectedEngine.sensorUploads.map((up) => (
                        <div key={up.upload_id} className="flex items-center justify-between py-2.5 text-xs">
                          <div className="flex flex-col">
                            <span className="font-mono font-medium text-[#0B1F3A]">{up.source_filename}</span>
                            <span className="text-[10px] text-[#94A3B8]">
                              {new Date(up.uploaded_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              · {up.row_count} rows
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {up.status === "VALID" ? (
                              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                Validated
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-600/20">
                                Failed
                              </span>
                            )}
                            {up.rul_generated && (
                              <span className="font-mono text-[11px] font-bold text-[#0B1F3A]">
                                RUL: {up.rul_generated}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
