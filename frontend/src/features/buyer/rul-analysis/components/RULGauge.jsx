export function RULGauge({ value, urgency }) {
  // Value from 0 to 150 cycles representation
  const maxCycles = 150;
  const clamped = Math.min(maxCycles, Math.max(0, value));
  const percentage = (clamped / maxCycles) * 100;

  let colorClass = "text-emerald-600 bg-emerald-500";
  let statusText = "Optimal Operating Condition";

  if (urgency === "PRIORITIZE") {
    colorClass = "text-red-600 bg-red-600";
    statusText = "Critical Threshold (< 20 cycles)";
  } else if (urgency === "PREPARE") {
    colorClass = "text-amber-600 bg-amber-500";
    statusText = "Maintenance Window (20-40 cycles)";
  } else if (urgency === "MONITOR") {
    colorClass = "text-blue-600 bg-blue-600";
    statusText = "Monitor Telemetry (40-80 cycles)";
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Predicted Remaining Useful Life (RUL)
      </span>

      <div className="my-5 relative flex items-baseline">
        <span className={`text-6xl font-black font-mono tracking-tight ${colorClass.split(" ")[0]}`}>
          {value}
        </span>
        <span className="text-sm font-bold text-slate-500 ml-2">cycles</span>
      </div>

      <p className="text-xs font-semibold text-slate-700">{statusText}</p>

      {/* Progress Bar Gauge */}
      <div className="w-full max-w-md bg-slate-100 rounded-full h-3 mt-4 overflow-hidden border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass.split(" ")[1]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="w-full max-w-md flex justify-between text-[10px] font-bold text-slate-400 mt-1.5 font-mono">
        <span>0 (Failure)</span>
        <span>20</span>
        <span>40</span>
        <span>80</span>
        <span>150+ cycles</span>
      </div>
    </div>
  );
}

