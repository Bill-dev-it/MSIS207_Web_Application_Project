export function EngineSelector({ engines, selectedEngineId, onSelectEngine }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Step 1: Select Fleet Engine for Analysis
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Choose an aircraft engine from your authorized fleet inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {engines.map((eng) => {
          const isSelected = String(selectedEngineId) === String(eng.engineId);
          return (
            <button
              key={eng.engineId}
              type="button"
              onClick={() => onSelectEngine(eng.engineId)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-blue-50/50 border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-900">
                  {eng.engineCode}
                </span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                  }`}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>

              <div className="mt-2 text-xs space-y-1">
                <p className="font-semibold text-slate-800">{eng.modelName}</p>
                <p className="text-slate-500">
                  Tail: <span className="text-slate-700 font-medium">{eng.aircraftTail}</span>
                </p>
                <p className="font-mono text-slate-500 text-[11px]">
                  Cycle: {eng.currentCycle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

