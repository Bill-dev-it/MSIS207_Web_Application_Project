import { Link } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { StatusBadge } from "../ui/StatusBadge";

export function EngineDetailModal({ engine, onClose }) {
  if (!engine) return null;

  const chartData = (engine.rulHistory || []).map((h) => ({
    cycle: h.cycle,
    rul: h.predictedRul,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0D1829] border border-cyan-500/30 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono text-cyan-400">{engine.engineCode}</span>
              <StatusBadge status={engine.latestPrediction?.urgency} />
            </div>
            <div className="text-sm text-slate-300 mt-1">
              {engine.engineModel?.manufacturer} • {engine.engineModel?.modelName}
            </div>
            <div className="text-xs font-mono text-slate-500">
              Serial: {engine.serialNumber} • Installed on: {engine.aircraft?.registrationNumber} ({engine.aircraft?.model})
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="p-3.5 rounded-xl bg-[#091024] border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400">Current Cycle</div>
            <div className="text-lg font-bold font-mono text-white mt-1">{engine.currentCycle}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#091024] border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400">Predicted RUL</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {engine.latestPrediction?.predictedRul ? `${engine.latestPrediction.predictedRul} cycles` : "N/A"}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#091024] border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400">Telemetry Sets</div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
              {engine.uploads?.length || 0} batches
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#091024] border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-400">Engine Family</div>
            <div className="text-sm font-semibold text-white mt-1.5 truncate">
              {engine.engineModel?.engineFamily || "CFM56"}
            </div>
          </div>
        </div>

        {/* RUL Trajectory Chart */}
        {chartData.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#091024] border border-slate-800 mb-6">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
              <span>Historical RUL Deterioration Curve</span>
              <span className="text-[11px] text-slate-500">C-MAPSS Sensor Inference</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="cycle" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0D1829", borderColor: "#334155", borderRadius: "12px", fontSize: "11px" }}
                  />
                  <Line type="monotone" dataKey="rul" stroke="#00E5FF" strokeWidth={2} dot={{ r: 3, fill: "#00E5FF" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono">
            Compatibility fitment indexed in Gold layer.
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 text-xs font-medium hover:bg-slate-800"
            >
              Close Dossier
            </button>
            <Link
              to={`/buyer/recommendations?engineId=${engine.engineId}`}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
            >
              Find Compatible Replacement Spares →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
