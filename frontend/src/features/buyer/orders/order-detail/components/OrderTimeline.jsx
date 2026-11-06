export default function OrderTimeline({ status = "CONFIRMED", createdAt }) {
  const normStatus = String(status || "CONFIRMED").toUpperCase();

  const steps = [
    { id: "CONFIRMED", label: "Order Placed & Confirmed", date: createdAt },
    { id: "PROCESSING", label: "Supplier processing", date: null },
    { id: "SHIPPED", label: "Shipped", date: null },
    { id: "DELIVERED", label: "Delivered", date: null },
  ];

  const statusOrder = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentIdx = statusOrder.indexOf(normStatus) !== -1 ? statusOrder.indexOf(normStatus) : 0;

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs mb-6">
      <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider text-slate-500">
        Supplier fulfillment status
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.id} className="relative flex flex-col items-start sm:items-center text-left sm:text-center">
              {/* Step indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors mb-2 z-10 ${
                  isDone
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>

              <p className={`text-xs font-bold ${isDone ? "text-slate-900" : "text-slate-400"}`}>
                {step.label}
              </p>

              {step.date && idx === 0 && (
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {new Date(step.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
