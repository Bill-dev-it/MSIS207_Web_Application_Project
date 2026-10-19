import { NavLink } from "react-router-dom";

const routes = [
  { to: "/", label: "Public", end: true },
  { to: "/buyer", label: "Buyer" },
  { to: "/supplier", label: "Supplier" },
  { to: "/admin", label: "Admin" },
];

export default function RoleNavigation() {
  return (
    <nav aria-label="Main navigation" className="flex flex-wrap gap-2">
      {routes.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary-700 text-white"
                : "text-primary-700 hover:bg-primary-50"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
