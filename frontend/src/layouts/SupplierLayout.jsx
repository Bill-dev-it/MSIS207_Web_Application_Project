import { NavLink, Outlet } from "react-router-dom";
import AccountActions from "../components/common/AccountActions";

const supplierNavLinks = [
  { to: "/supplier", label: "Overview", end: true },
  { to: "/supplier/listings", label: "Listings" },
  { to: "/supplier/inventory", label: "Inventory" },
  { to: "/supplier/orders", label: "Orders" },
];

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-primary-800">
              AeroRUL
            </span>
            <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-800">
              Supplier Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NavLink
              to="/marketplace"
              className="text-xs font-semibold text-primary-700 hover:underline"
            >
              Public Marketplace
            </NavLink>
            <AccountActions />
          </div>
        </div>
      </header>

      <div className="container-page py-6">
        <nav
          aria-label="Supplier Workspace Navigation"
          className="mb-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-4"
        >
          {supplierNavLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#0B192C] text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main id="supplier-main" className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
