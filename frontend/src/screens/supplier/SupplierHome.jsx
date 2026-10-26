
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

const workflows = [
  {
    title: "Product Listings",
    description:
      "Create and manage aviation parts offers, pricing, and product availability.",
    status: "Planned Integration",
  },
  {
    title: "Inventory Management",
    description:
      "Monitor stock quantities and manage available inventory.",
    status: "Planned Integration",
  },
  {
    title: "Incoming Orders",
    description:
      "Review buyer orders and manage order fulfillment.",
    status: "Planned Integration",
  },
];

export default function SupplierHome() {
  return (
    <div>
      <PageHeader
        eyebrow="Supplier Portal"
        title="Supplier Overview"
        description="Manage your aviation parts business through AeroRUL."
        actions={
          <Link to="/marketplace" className="btn btn-secondary">
            View Marketplace
          </Link>
        }
      />

      <section
        aria-label="Integration status"
        className="mb-8 rounded-xl border border-accent/30 bg-accent-50 p-4"
      >
        <p className="text-sm text-primary-800">
          Supplier management features are currently under
          development. Live supplier data will be available
          after backend integration.
        </p>
      </section>

      <section aria-labelledby="workflow-heading">
        <h2
          id="workflow-heading"
          className="mb-5 text-xl font-semibold text-primary-800"
        >
          Supplier Workflows
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {workflows.map((workflow) => (
            <article
              key={workflow.title}
              className="card flex flex-col p-6"
            >
              <h3 className="text-lg font-semibold text-primary-800">
                {workflow.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-500">
                {workflow.description}
              </p>

              <span className="mt-6 w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                {workflow.status}
              </span>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <EmptyState
          title="No supplier data connected"
          description="Your listings, inventory, and orders will appear after authenticated supplier APIs are integrated."
        />
      </div>
    </div>
  );
}
