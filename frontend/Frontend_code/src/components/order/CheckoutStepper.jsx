export default function CheckoutStepper({ steps, currentStep }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((step, idx) => {
        const state = idx < currentStep ? "done" : idx === currentStep ? "active" : "upcoming";
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                state === "done"
                  ? "bg-success text-white"
                  : state === "active"
                  ? "bg-primary-700 text-white"
                  : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {state === "done" ? "✓" : idx + 1}
            </span>
            <span className={state === "upcoming" ? "text-neutral-500" : "font-medium text-primary-800"}>{step}</span>
            {idx < steps.length - 1 && <span className="mx-1 text-neutral-300">—</span>}
          </li>
        );
      })}
    </ol>
  );
}
