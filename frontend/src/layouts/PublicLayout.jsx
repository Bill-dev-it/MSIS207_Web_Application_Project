import { Link, NavLink, Outlet } from "react-router-dom";
import AccountActions from "../components/common/AccountActions";

const navigationLinks = [
  { to: "/", label: "Home" },
  { to: "/marketplace", label: "Marketplace" },
];

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-800">
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-primary-800 hover:text-primary-700"
          >
            AeroRUL
          </Link>

          <nav
            aria-label="Public navigation"
            className="flex flex-wrap items-center gap-6 text-sm font-medium"
          >
            {navigationLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `transition-colors hover:text-primary-700 ${
                    isActive ? "text-primary-700" : "text-neutral-500"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <AccountActions />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-400">
        AeroRUL Aviation B2B Platform &bull; Academic Engineering Project
      </footer>
    </div>
  );
}
