
import { NavLink, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex min-h-16 items-center justify-between gap-4 py-3">
          <NavLink
            to="/"
            className="text-xl font-bold tracking-tight text-primary-700"
            aria-label="AeroRUL Home"
          >
            Aero<span className="text-accent">RUL</span>
          </NavLink>

          <nav aria-label="Public navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-neutral-500 hover:text-primary-700"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/marketplace"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-neutral-500 hover:text-primary-700"
                }`
              }
            >
              Marketplace
            </NavLink>
          </nav>
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
