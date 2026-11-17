import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { postLoginDestination } from "../../auth/roleRoutes";
import AuthScreenFrame from "./AuthScreenFrame";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login({ email: email.trim(), password });
      navigate(postLoginDestination(user.role, location.state?.from?.pathname), { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreenFrame eyebrow="AeroRUL account" title="Log in" description="Sign in with your AeroRUL account email to access your workspace.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="login-email">Business email</label><input className="input" id="login-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="login-password">Password</label><input className="input" id="login-password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
      </form>
      <p className="text-sm text-neutral-700">New to AeroRUL? <Link className="font-semibold text-primary-700 underline" to="/register">Register your company</Link>.</p>
    </AuthScreenFrame>
  );
}
