import { formatCurrency } from "../../../cart/utils/cartCalculations";

export default function DeliveryMethodSelector({
  methods = [],
  selectedMethodId,
  onSelectMethod,
}) {
  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">
          2. Aerospace Logistics & Freight Method
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select shipment urgency based on line maintenance schedule or Aircraft-On-Ground (AOG) status.
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
                  name="delivery_method"
                  checked={isSelected}
                  onChange={() => onSelectMethod(method.id)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {method.name}
                    </span>
                    {method.id === "EXPRESS" && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 tracking-wider">
                        AOG Priority
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Carrier: {method.carrier} • Transit: {method.lead_time}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {method.description}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-base font-black text-slate-900 font-mono">
                  {formatCurrency(method.cost)}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Flat Rate Freight
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

