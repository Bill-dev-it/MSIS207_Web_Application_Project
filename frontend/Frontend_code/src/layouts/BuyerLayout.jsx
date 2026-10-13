import { Outlet } from "react-router-dom";
import { AppHeader } from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import CartDrawer from "../components/order/CartDrawer";

export default function BuyerLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader />
      <div className="flex">
        <Sidebar role="buyer" />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <CartDrawer />
    </div>
  );
}
