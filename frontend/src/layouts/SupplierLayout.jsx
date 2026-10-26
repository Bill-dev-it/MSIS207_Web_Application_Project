import { NavLink, Outlet } from "react-router-dom";

const workspaceLinks = [
  { to: "/supplier", label: "Overview", end: true },
  { to: "/supplier/listings", label: "My Listings" },
  { to: "/supplier/inventory", label: "Inventory" },
];

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 text-primary-800">
      <a href="#supplier-main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">
        Skip to supplier content
      </a>
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <NavLink to="/" className="text-xl font-bold tracking-tight text-primary-700" aria-label="AeroRUL public home">
            Aero<span className="text-accent">RUL</span>
          </NavLink>
          <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700">
            Supplier workspace
          </span>
        </div>
      </header>
      <div className="container-page grid gap-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:py-10">
        <nav aria-label="Supplier navigation" className="flex flex-wrap gap-2 lg:flex-col">
          {workspaceLinks.map(({to,label,end}) => (
            <NavLink key={to} to={to} end={end}
              className={({isActive}) => `rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${isActive ? "bg-primary-700 text-white" : "bg-white text-primary-700 hover:bg-primary-50"}`}>
              {label}
            </NavLink>
          ))}
          <NavLink to="/marketplace" className="rounded-lg px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            View public marketplace
          </NavLink>
        </nav>
        <main id="supplier-main" className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
