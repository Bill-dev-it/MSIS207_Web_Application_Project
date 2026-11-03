import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { checkSupplierApproval } from "../services/authApi";

function GateMessage({ title, children }) {
  return (
    <main className="container-page py-10 sm:py-16" id="main-content">
      <section className="card mx-auto max-w-xl space-y-4 p-5 sm:p-8" aria-labelledby="auth-gate-title">
        <h1 id="auth-gate-title" className="text-2xl font-bold text-primary-800">{title}</h1>
        <div className="space-y-3 text-sm text-neutral-700">{children}</div>
        <Link className="btn btn-secondary" to="/">Return to marketplace</Link>
      </section>
    </main>
  );
}

function SupplierApprovalGate({ userId }) {
  const [check, setCheck] = useState({ userId: null, status: "loading", message: "" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCheck({ userId, status: "loading", message: "" });
    checkSupplierApproval({ signal: controller.signal })
      .then(() => {
        if (!controller.signal.aborted) setCheck({ userId, status: "approved", message: "" });
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        const status = error.status === 403 && error.code === "SUPPLIER_NOT_APPROVED"
          ? "pending"
          : error.status === 401 ? "expired" : "error";
        setCheck({ userId, status, message: error.message });
      });
    return () => controller.abort();
  }, [userId, attempt]);

  if (check.userId !== userId || check.status === "loading") {
    return <GateMessage title="Checking supplier access"><p role="status">Verifying your supplier approval…</p></GateMessage>;
  }
  if (check.status === "approved") return <Outlet />;
  if (check.status === "pending") {
    return <GateMessage title="Supplier approval pending"><p>Your account is registered, but the supplier workspace becomes available only after approval.</p></GateMessage>;
  }
  if (check.status === "expired") {
    return <GateMessage title="Please sign in again"><p>Your session has expired. <Link className="underline" to="/login">Sign in</Link> to continue.</p></GateMessage>;
  }
  return (
    <GateMessage title="Supplier access unavailable">
      <p role="alert">{check.message || "Unable to check your supplier approval right now."}</p>
      <button type="button" className="btn btn-primary" onClick={() => setAttempt((n) => n + 1)}>Retry access check</button>
    </GateMessage>
  );
}

export default function ProtectedRoute({ roles = [], requireSupplierApproval = false }) {
  const { status, user, error, refresh } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <GateMessage title="Checking your session"><p role="status">Loading account information…</p></GateMessage>;
  }
  if (status === "error") {
    return <GateMessage title="Authentication unavailable"><p role="alert">{error || "We could not check your session."}</p><button type="button" className="btn btn-primary" onClick={() => refresh()}>Retry</button></GateMessage>;
  }
  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles.length && !roles.includes(user.role)) {
    return <GateMessage title="Access denied"><p>Your account role does not have permission to open this workspace.</p></GateMessage>;
  }
  if (requireSupplierApproval) {
    return <SupplierApprovalGate userId={String(user.user_id)} />;
  }
  return <Outlet />;
}
