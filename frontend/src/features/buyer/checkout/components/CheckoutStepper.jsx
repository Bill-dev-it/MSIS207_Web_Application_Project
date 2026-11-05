import { Link } from "react-router-dom";

export default function CheckoutStepper({ currentStep = 1 }) {
  const steps = [
    { number: 1, label: "Cart", path: "/cart" },
    { number: 2, label: "Shipping", path: "/checkout/shipping" },
    { number: 3, label: "Payment", path: "/checkout/payment" },
    { number: 4, label: "Review", path: "/checkout/review" },
  ];

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <li key={step.number} className="flex-1 relative">
              <div className="flex items-center">
                {/* Step Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 z-10 ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step Name */}
                <span
                  className={`ml-2 text-xs font-semibold whitespace-nowrap hidden sm:inline ${
                    isCurrent
                      ? "text-blue-600 font-bold"
                      : isCompleted
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>

                {/* Connector Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 transition-colors ${
                      isCompleted ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

