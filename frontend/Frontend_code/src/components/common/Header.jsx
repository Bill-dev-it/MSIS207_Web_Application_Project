import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-primary-800">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary-700 text-sm font-bold text-white">
        AR
      </span>
      <span className="text-base font-semibold tracking-tight">AeroRUL</span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-6">
        <Logo />
        <nav className="hidden items-center gap-5 text-sm font-medium text-primary-800 md:flex">
          <Link to="/marketplace" className="hover:text-accent">Marketplace</Link>
          <Link to="/marketplace?tab=categories" className="hover:text-accent">Categories</Link>
          <Link to="/marketplace?tab=suppliers" className="hover:text-accent">Suppliers</Link>
          <Link to="/how-it-works" className="hover:text-accent">How It Works</Link>
        </nav>
        <div className="ml-auto flex flex-1 items-center justify-end gap-3 md:flex-none">
          <input
            className="input hidden max-w-xs md:block"
            placeholder="Search part number, engine model…"
          />
          <Link to="/login" className="btn-ghost">Login</Link>
          <Link to="/register" className="btn-primary">Register</Link>
        </div>
      </div>
    </header>
  );
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const { itemCount, setDrawerOpen } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-primary-700 text-white">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/10 text-sm font-bold">
            AR
          </span>
          <span className="hidden text-base font-semibold tracking-tight sm:inline">AeroRUL</span>
        </Link>
        <input
          className="hidden max-w-md flex-1 rounded-[10px] border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:border-accent md:block"
          placeholder="Search products, part number, engine model…"
        />
        <div className="ml-auto flex items-center gap-4">
          <button className="relative rounded-full p-2 hover:bg-white/10" aria-label="Notifications">
            🔔
          </button>
          {user?.role === "buyer" && (
            <button
              className="relative rounded-full p-2 hover:bg-white/10"
              aria-label="Cart"
              onClick={() => setDrawerOpen(true)}
            >
              🛒
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          )}
          <div className="group relative">
            <button className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 hover:bg-white/10">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold">
                {user?.companyName?.[0] ?? "U"}
              </span>
              <span className="hidden text-sm sm:inline">{user?.companyName}</span>
              <span className="text-xs">▾</span>
            </button>
            <div className="invisible absolute right-0 mt-1 w-44 rounded-[10px] border border-neutral-200 bg-white py-1 text-sm text-primary-800 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
              <Link to={`/${user?.role}/settings`} className="block px-3 py-2 hover:bg-neutral-50">Account Settings</Link>
              <button onClick={handleLogout} className="block w-full px-3 py-2 text-left hover:bg-neutral-50">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
