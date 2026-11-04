export default function BuyerHome() {
  return (
    <main className="container-page py-12">
      <section className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Buyer workspace
        </p>
        <h1 className="mt-3 text-3xl font-bold text-primary-800">
          Buyer Workspace
        </h1>
        <p className="mt-4 text-neutral-500">
          Your starting point for marketplace shopping, fleet insights, and
          orders.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="/buyer/engines"
            className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-5 hover:bg-neutral-100 transition"
          >
            <span className="font-bold text-[#0B1F3A]">My Engines</span>
            <span className="mt-1 text-xs text-neutral-500">
              Fleet overview, cycle tracking, and RUL predictions for 24 active engines.
            </span>
          </a>

          <a
            href="/buyer/orders"
            className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-5 hover:bg-neutral-100 transition"
          >
            <span className="font-bold text-[#0B1F3A]">Orders</span>
            <span className="mt-1 text-xs text-neutral-500">
              View procurement orders, shipment tracking, and delivery timelines.
            </span>
          </a>

          <a
            href="/buyer/recommendations"
            className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-5 hover:bg-neutral-100 transition"
          >
            <span className="font-bold text-[#0B1F3A]">Replacement Recommendations</span>
            <span className="mt-1 text-xs text-neutral-500">
              AI-driven part matching for urgent and scheduled engine replacements.
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}
