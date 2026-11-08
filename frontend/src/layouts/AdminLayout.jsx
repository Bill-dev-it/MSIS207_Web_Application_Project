import { NavLink, Outlet } from "react-router-dom";
import RoleNavigation from "../components/common/RoleNavigation";
import AccountActions from "../components/common/AccountActions";

const sections = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/suppliers", label: "Supplier approvals" },
  { to: "/admin/payments", label: "Bank transfers" },
  { to: "/admin/rul-health", label: "RUL health" },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <span className="text-lg font-bold text-primary-800">AeroRUL Admin</span>
          <RoleNavigation />
          <AccountActions />
        </div>
      </header>
      <nav aria-label="Admin workspace" className="border-b border-neutral-200 bg-white">
        <div className="container-page flex flex-wrap gap-2 py-2">
          {sections.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isActive ? "bg-primary-700 text-white" : "text-primary-700 hover:bg-primary-50"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="container-page w-full py-8" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
