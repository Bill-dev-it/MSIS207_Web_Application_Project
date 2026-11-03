import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ROLE_HOME } from "../../auth/roleRoutes";

export default function AccountActions() {
  const { status, user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign out. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <span className="text-sm text-neutral-500" role="status">Checking session…</span>;
  if (status === "error") return <button type="button" className="btn btn-secondary" onClick={() => refresh()}>Retry account status</button>;
  if (status !== "authenticated" || !user) {
    return <div className="flex flex-wrap items-center gap-2"><Link to="/login" className="btn btn-secondary">Log in</Link><Link to="/register" className="btn btn-primary">Register</Link></div>;
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
      <span className="max-w-36 truncate text-neutral-600" title={user.full_name}>{user.full_name}</span>
      <Link className="btn btn-secondary" to={ROLE_HOME[user.role] || "/"}>Workspace</Link>
      <button type="button" className="btn btn-ghost" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Log out"}</button>
      {error && <span className="w-full text-right text-sm text-red-700" role="alert">{error}</span>}
    </div>
  );
}
