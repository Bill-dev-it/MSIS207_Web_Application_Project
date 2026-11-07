import { Link } from "react-router-dom";

export default function AdminHome() {
  const adminScreens = [
    {
      title: "Admin Dashboard",
      description:
        "Overview of marketplace health, KPI metrics, sales trends, and RUL service status.",
      to: "/admin/dashboard",
    },
    {
      title: "Supplier & Product Moderation",
      description:
        "Manage product approval reviews, specification verification, moderation queues, and supplier status.",
      to: "/admin/moderation",
    },
    {
      title: "RUL System Status",
      description:
        "Monitor predictive RUL service health, prediction volume, and recent processing activity.",
      to: "/admin/rul-status",
    },
    {
      title: "Replacement Recommendations",
      description:
        "Review ranked replacement part recommendations based on engine RUL urgency and component compatibility.",
      to: "/admin/recommendations",
    },
  ];

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          AeroRUL Administration Hub
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-primary-800">
          Admin Portal
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Select an administration module to manage marketplace operations, moderation queues, and predictive RUL services.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {adminScreens.map((screen) => (
          <Link
            key={screen.to}
            to={screen.to}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md"
          >
            <div>
              <h2 className="text-xl font-bold text-primary-800 group-hover:text-accent transition-colors">
                {screen.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {screen.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
