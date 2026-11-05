export default function PaymentMethodSelector({
  methods = [],
  selectedMethodId,
  onSelectMethod,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Payment</h2>
        <p className="mt-1 text-sm text-slate-600">
          Only a development simulation is available; no payment is collected.
        </p>
      </div>
      <fieldset className="space-y-3">
        <legend className="sr-only">Select a payment method</legend>
        {methods.map((method) => {
          const isSelected = method.id === selectedMethodId;
          return (
            <label
              key={method.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${
                isSelected ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={method.id}
                checked={isSelected}
                onChange={() => onSelectMethod(method.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="min-w-0">
                <span className="block font-semibold text-slate-900">{method.name}</span>
                <span className="mt-1 block text-sm text-slate-600">{method.description}</span>
              </span>
              {method.badge && (
                <span className="ml-auto shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                  {method.badge}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="note">
        Simulation only — this does not authorize or transfer real funds.
      </p>
    </section>
  );
}
