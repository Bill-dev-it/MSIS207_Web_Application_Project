import { Outlet } from "react-router-dom";
import RoleNavigation from "../components/common/RoleNavigation";

export default function SupplierLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <span className="text-lg font-bold text-primary-800">
            Supplier Portal
          </span>
          <RoleNavigation />
        </div>
      </header>
      <Outlet />
    </div>
  );
}
