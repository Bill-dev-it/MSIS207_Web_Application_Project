import StatusBadge from "../../../shared/components/common/StatusBadge";

export default function BuyerHome() {
  return (
    <main className="container-page py-12">
      <section className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Buyer workspace
        </p>
        <h1 className="mt-3 text-3xl font-bold text-primary-800">
          Buyer Home
        </h1>
        <p className="mt-4 text-neutral-500">
          Your starting point for marketplace shopping, fleet insights, and
          orders.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <StatusBadge status="success" label="Active" />
          <StatusBadge status="warning" label="Pending" />
          <StatusBadge status="danger" label="Critical" />
          <StatusBadge status="info" label="Processing" />
          <StatusBadge status="neutral" label="Unknown" />
        </div>
      </section>
    </main>
  );
}
