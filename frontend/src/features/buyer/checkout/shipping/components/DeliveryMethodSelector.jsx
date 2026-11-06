import { formatCurrency } from "../../../cart/utils/cartCalculations";

export default function DeliveryMethodSelector({
  methods = [],
  selectedMethodId,
  onSelectMethod,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-slate-900">2. Delivery estimate</h2>
      <p className="mt-1 text-sm text-slate-600">
        These application estimates are not carrier quotes or delivery guarantees.
      </p>
      {methods.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No delivery options are available.</p>
      ) : (
        <fieldset className="mt-4 space-y-3">
          <legend className="sr-only">Choose a delivery estimate</legend>
          {methods.map((method) => {
            const selected = method.id === selectedMethodId;
            return (
              <label
                key={method.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${
                  selected ? "border-blue-600 bg-blue-50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="delivery_method"
                  value={method.id}
                  checked={selected}
                  onChange={() => onSelectMethod(method.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">{method.name}</span>
                  <span className="mt-1 block text-sm text-slate-600">{method.description}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Estimated transit: {method.lead_time}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-bold text-slate-900">{formatCurrency(method.cost)}</span>
                  <span className="block text-xs text-slate-500">Estimate</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      )}
    </section>
  );
}
