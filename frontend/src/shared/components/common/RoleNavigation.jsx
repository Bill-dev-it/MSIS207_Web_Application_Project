
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { NAVIGATION_CONFIG } from "../../../config/navigationConfig";

export default function RoleNavigation() {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const publicLinks = NAVIGATION_CONFIG.PUBLIC;
  const roleLinks = isAuthenticated
    ? NAVIGATION_CONFIG[role] || []
    : [];

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  const links = [...publicLinks, ...roleLinks];

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-wrap items-center gap-4"
    >
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) =>
            [
              "text-sm font-medium transition-colors",
              isActive
                ? "text-primary-700"
                : "text-neutral-600 hover:text-primary-700",
            ].join(" ")
          }
        >
          {link.label}
        </NavLink>
      ))}

      {!isAuthenticated ? (
        <NavLink to="/login" className="btn-primary">
          Sign in
        </NavLink>
      ) : (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-neutral-500 sm:inline">
            {user?.email}
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
