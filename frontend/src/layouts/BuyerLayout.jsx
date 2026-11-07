import { NavLink, Outlet, useLocation } from "react-router-dom";
import RoleNavigation from "../components/common/RoleNavigation";
import AccountActions from "../components/common/AccountActions";
import { NAVIGATION_CONFIG } from "../config/navigationConfig";
import { useCart } from "../features/buyer/cart";

function isBuyerNavActive(pathname, item) {
  const paths = item.matchPaths || [item.path];
  if (item.exact) {
    return paths.includes(pathname);
  }
  return paths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default function BuyerLayout() {
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const buyerNavItems = NAVIGATION_CONFIG.BUYER || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <span className="text-lg font-bold text-primary-800">Buyer Portal</span>
          <RoleNavigation />
          <AccountActions />
        </div>
      </header>
      <nav aria-label="Buyer workspace" className="border-b border-neutral-200 bg-white">
        <div className="container-page flex flex-wrap gap-2 py-2">
          {buyerNavItems.map((item) => {
            const active = isBuyerNavActive(pathname, item);
            const label = item.showCartCount
              ? `${item.label} (${itemCount})`
              : item.label;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={Boolean(item.exact)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-700 text-white"
                    : "text-primary-700 hover:bg-primary-50"
                }`}
              >
                {label}
              </NavLink>
            );
          })}
        </div>
      </nav>
      <main className="container-page w-full py-8">
        <Outlet />
      </main>
    </div>
  );
}
