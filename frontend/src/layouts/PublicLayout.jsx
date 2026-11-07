
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AccountActions from "../components/common/AccountActions";
import RoleNavigation from "../components/common/RoleNavigation";

export default function PublicLayout() {
  const { status, user } = useAuth();
  const isAuthenticated = status === "authenticated" && Boolean(user);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <NavLink
            to="/"
            className="text-xl font-bold tracking-tight text-primary-700"
            aria-label="AeroRUL Home"
          >
            Aero<span className="text-accent">RUL</span>
          </NavLink>

          {isAuthenticated && <RoleNavigation />}
          <AccountActions />
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="container-page py-6">
          <p className="text-center text-sm text-neutral-500">
            © {new Date().getFullYear()} AeroRUL. Aviation B2B Marketplace.
          </p>
        </div>
      </footer>
    </div>
  );
}
