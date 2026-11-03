import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AccountActions from "./AccountActions";

const buyerLinks = [
  { to: "/buyer", label: "Buyer Home", end: true },
  { to: "/buyer/engines", label: "My Engines" },
  { to: "/buyer/orders", label: "Orders" },
  { to: "/buyer/recommendations", label: "Recommendations" },
];

const supplierLinks = [
  { to: "/supplier", label: "Supplier Home", end: true },
  { to: "/supplier/listings", label: "Listings" },
  { to: "/supplier/inventory", label: "Inventory" },
  { to: "/supplier/orders", label: "Orders" },
];

const adminLinks = [
  { to: "/admin", label: "Admin Home", end: true },
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/moderation", label: "Moderation" },
  { to: "/admin/rul-status", label: "RUL Status" },
  { to: "/admin/recommendations", label: "Recommendations" },
];

export default function RoleNavigation() {
  const { user } = useAuth();
  const role = user?.role;

  let links = [];
  if (role === "BUYER") {
    links = buyerLinks;
  } else if (role === "SUPPLIER") {
    links = supplierLinks;
  } else if (role === "ADMIN") {
    links = adminLinks;
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <nav aria-label="Portal Navigation" className="flex flex-wrap gap-2">
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-[#0B192C] text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <AccountActions />
    </div>
  );
}
