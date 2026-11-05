export default function NextStepsInformation() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
        Order status and fulfillment
      </h2>
      <p className="mt-3 text-sm text-slate-600">
        This confirmation records the order and simulated payment result. Supplier processing, shipment and tracking details appear in Order Details only when those statuses and records are provided by the backend.
      </p>
    </section>
  );
}
