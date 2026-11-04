export default function NextStepsInformation() {
  const steps = [
    {
      num: "01",
      title: "Supplier EDI PO Transmission",
      description: "Direct EDI 850 Purchase Order has been electronically transmitted to OEM and Part 145 certified distributors.",
    },
    {
      num: "02",
      title: "Dual Airworthiness QA & Crating",
      description: "Suppliers inspect serial batches, affix dual-release certificates (FAA Form 8130-3 / EASA Form 1), and prepare shock-damped crating.",
    },
    {
      num: "03",
      title: "Consignment Ramp Dispatch & Tracking",
      description: "Waybill tracking codes will appear in your Order Detail view as soon as courier ramps clear cargo dispatch.",
    },
  ];

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
        Next Steps in Aircraft Spares Fulfillment
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s) => (
          <div key={s.num} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-mono font-extrabold text-blue-600 text-xs">
              STEP {s.num}
            </span>
            <h3 className="text-xs font-bold text-slate-900">{s.title}</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

