import { NavLink } from "react-router-dom";

const NAV_BY_ROLE = {
  buyer: [
    { to: "/buyer/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/marketplace", label: "Marketplace", icon: "🛍️" },
    { to: "/buyer/engines", label: "My Engines", icon: "✈️" },
    { to: "/buyer/rul-analysis", label: "RUL Analysis", icon: "📈" },
    { to: "/buyer/recommendations", label: "Replacement Recommendations", icon: "🔧" },
    { to: "/buyer/wishlist", label: "Wishlist", icon: "❤️" },
    { to: "/buyer/orders", label: "Orders", icon: "📦" },
    { to: "/buyer/notifications", label: "Notifications", icon: "🔔" },
    { to: "/buyer/company-profile", label: "Company Profile", icon: "🏢" },
    { to: "/buyer/settings", label: "Account Settings", icon: "⚙️" },
  ],
  supplier: [
    { to: "/supplier/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/supplier/products", label: "Products", icon: "📦" },
    { to: "/supplier/inventory", label: "Inventory", icon: "🗃️" },
    { to: "/supplier/orders", label: "Orders", icon: "🧾" },
    { to: "/supplier/reviews", label: "Reviews", icon: "⭐" },
    { to: "/supplier/analytics", label: "Analytics", icon: "📈" },
    { to: "/supplier/store-profile", label: "Store Profile", icon: "🏬" },
    { to: "/supplier/settings", label: "Settings", icon: "⚙️" },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/admin/users", label: "Users", icon: "👤" },
    { to: "/admin/companies", label: "Companies / Buyers", icon: "🏢" },
    { to: "/admin/suppliers", label: "Suppliers", icon: "🏬" },
    { to: "/admin/products", label: "Products", icon: "📦" },
    { to: "/admin/categories", label: "Categories", icon: "🗂️" },
    { to: "/admin/orders", label: "Orders", icon: "🧾" },
    { to: "/admin/reports", label: "Reviews / Reports", icon: "🚩" },
    { to: "/admin/rul-status", label: "RUL System Status", icon: "🩺" },
    { to: "/admin/settings", label: "System Settings", icon: "⚙️" },
  ],
};

export default function Sidebar({ role }) {
  const items = NAV_BY_ROLE[role] || [];
  return (
    <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white md:block">
      <nav className="flex flex-col gap-0.5 p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-primary-50 text-primary-700" : "text-neutral-500 hover:bg-neutral-50 hover:text-primary-800"
              }`
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
