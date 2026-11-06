export default function PaymentMethodSelector({
  methods = [],
  selectedMethodId,
  onSelectMethod,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Payment Method</h2>
        <p className="mt-1 text-sm text-slate-600">
          Select one of the two demonstration B2B payment methods below. Neither option collects card details or transfers real money.
        </p>
      </div>
      <fieldset className="space-y-3">
        <legend className="sr-only">Select a payment method</legend>
        {methods.map((method) => {
          const isSelected = method.id === selectedMethodId;
          return (
            <label
              key={method.id}
              className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 sm:flex-row sm:items-start sm:justify-between ${
                isSelected ? "border-blue-600 bg-blue-50/70" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="flex items-start gap-3 min-w-0">
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
                  {method.notice && (
                    <span className="mt-1.5 block text-xs font-semibold text-amber-900">
                      {method.notice}
                    </span>
                  )}
                </span>
              </span>
              {method.badge && (
                <span className="self-start shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                  {method.badge}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900" role="note">
        Demo only — do not transfer real money. If you choose Bank Transfer (Demo), the unique order number generated at checkout serves as the demonstration transfer reference.
      </p>
    </section>
  );
}
