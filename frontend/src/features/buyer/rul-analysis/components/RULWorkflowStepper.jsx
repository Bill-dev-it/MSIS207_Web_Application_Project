export function RULWorkflowStepper({ currentStep }) {
  const steps = [
    { number: 1, title: "Select Engine", desc: "Choose fleet engine" },
    { number: 2, title: "Upload Telemetry", desc: "30-cycle sensor CSV" },
    { number: 3, title: "Run Inference", desc: "ML RUL model prediction" },
    { number: 4, title: "Results & Recommendations", desc: "Action plan & parts fitment" },
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isDone = currentStep > step.number;

          return (
            <div
              key={step.number}
              className={`p-3.5 rounded-lg border transition-all ${
                isActive
                  ? "bg-blue-50/60 border-blue-500 shadow-xs"
                  : isDone
                  ? "bg-slate-50 border-emerald-300"
                  : "bg-slate-50/50 border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isDone ? "✓" : step.number}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">{step.title}</p>
                  <p className="text-[11px] text-slate-500">{step.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

