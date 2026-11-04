import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { checkSupplierApproval } from "../../services/authApi";

export default function RoleNavigation() {
  const { status, user } = useAuth();
  const [supplierAccess, setSupplierAccess] = useState({
    userId: null,
    status: "idle",
    message: "",
  });

  useEffect(() => {
    if (status !== "authenticated" || user?.role !== "SUPPLIER") {
      setSupplierAccess({ userId: null, status: "idle", message: "" });
      return undefined;
    }

    const controller = new AbortController();
    const userId = String(user.user_id);
    setSupplierAccess({ userId, status: "checking", message: "" });
    checkSupplierApproval({ signal: controller.signal })
      .then(() => setSupplierAccess({ userId, status: "approved", message: "" }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setSupplierAccess({
          userId,
          status: "error",
          message: error.message || "Supplier access could not be verified.",
        });
      });
    return () => controller.abort();
  }, [status, user?.role, user?.user_id]);

  const routes = [{ to: "/", label: "Public", end: true }];
  if (status === "authenticated" && user?.role === "BUYER") {
    routes.push({ to: "/buyer", label: "Buyer" });
  }
  const currentSupplierAccess =
    supplierAccess.userId === String(user?.user_id) ? supplierAccess : null;
  if (
    status === "authenticated" &&
    user?.role === "SUPPLIER" &&
    currentSupplierAccess?.status === "approved"
  ) {
    routes.push({ to: "/supplier", label: "Supplier" });
  }
  if (status === "authenticated" && user?.role === "ADMIN") {
    routes.push({ to: "/admin", label: "Admin" });
  }

  return (
    <>
      <nav aria-label="Main navigation" className="flex flex-wrap gap-2">
        {routes.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-700 text-white"
                  : "text-primary-700 hover:bg-primary-50"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      {currentSupplierAccess?.status === "error" && (
        <span className="text-sm text-red-700" role="alert">
          {currentSupplierAccess.message}
        </span>
      )}
    </>
  );
}
