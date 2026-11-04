export default function PaymentMethodSelector({
  methods = [],
  selectedMethodId,
  onSelectMethod,
}) {
  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">
          1. Commercial Payment Method
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select commercial settlement terms or authorized simulated escrow.
        </p>
      </div>

      <div className="space-y-3">
        {methods.map((method) => {
          const isSelected = method.id === selectedMethodId;

          return (
            <div
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                isSelected
                  ? "border-blue-600 bg-blue-50/40 shadow-xs"
                  : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="payment_method"
                  checked={isSelected}
                  onChange={() => onSelectMethod(method.id)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {method.name}
                    </span>
                    {method.badge && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 tracking-wider">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {method.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full flex-shrink-0">
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
        <span className="text-blue-600 font-bold">🔒</span>
        <span>
          PCI-DSS Level 1 Encrypted: Raw credit card numbers are never collected or stored.
        </span>
      </div>
    </section>
  );
}

