import { Link } from "react-router-dom";

export default function AdminHome() {
  const adminScreens = [
    {
      title: "Admin Dashboard",
      description: "Overview of marketplace health, KPI metrics, sales trend chart, and RUL service status.",
      to: "/admin/dashboard",
      badge: "Screen 27",
      color: "from-blue-600 to-indigo-700",
    },
    {
      title: "Supplier & Product Moderation",
      description: "Queue management, product approval reviews, spec verification, and supplier status actions.",
      to: "/admin/moderation",
      badge: "Screen 15",
      color: "from-indigo-600 to-purple-700",
    },
    {
      title: "RUL System Status",
      description: "Real-time health monitoring of the predictive RUL engine, 14-day prediction volume, and recent runs.",
      to: "/admin/rul-status",
      badge: "Screen 44",
      color: "from-purple-600 to-pink-700",
    },
    {
      title: "Replacement Recommendations",
      description: "Ranked part recommendations based on engine RUL cycle urgency, specs comparison table, and cart flow.",
      to: "/admin/recommendations",
      badge: "Screen 13",
      color: "from-sky-600 to-blue-800",
    },
  ];

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          AeroRUL Administration Hub
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-primary-800">
          Admin Portal & Specialized Screens
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Access high-fidelity UI/UX implementations built from design specifications and Gold seed data.
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
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                  {screen.badge}
                </span>
                <span className="text-xs font-semibold text-accent group-hover:translate-x-1 transition-transform">
                  Open Screen →
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold text-primary-800 group-hover:text-accent transition-colors">
                {screen.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {screen.description}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary-700">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>Full UI/UX reproduction</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
