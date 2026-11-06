import { NavLink, Outlet } from "react-router-dom";
import RoleNavigation from "../components/common/RoleNavigation";
import AccountActions from "../components/common/AccountActions";
import { useCart } from "../features/buyer/cart";

export default function BuyerLayout() {
  const { itemCount } = useCart();
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
          <NavLink className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-primary-700 text-white" : "text-primary-700 hover:bg-primary-50"}`} to="/buyer" end>Dashboard</NavLink>
          <NavLink className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-primary-700 text-white" : "text-primary-700 hover:bg-primary-50"}`} to="/buyer/engines">My Engines</NavLink>
          <NavLink className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-primary-700 text-white" : "text-primary-700 hover:bg-primary-50"}`} to="/buyer/rul">RUL Analysis</NavLink>
          <NavLink className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-primary-700 text-white" : "text-primary-700 hover:bg-primary-50"}`} to="/orders">Orders</NavLink>
          <NavLink className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-primary-700 text-white" : "text-primary-700 hover:bg-primary-50"}`} to="/cart">Cart ({itemCount})</NavLink>
          <NavLink className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-primary-700 text-white" : "text-primary-700 hover:bg-primary-50"}`} to="/marketplace">Marketplace</NavLink>
        </div>
      </nav>
      <main className="container-page w-full py-8">
        <Outlet />
      </main>
    </div>
  );
}
