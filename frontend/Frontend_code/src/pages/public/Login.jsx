import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ROLE_HOME = { buyer: "/buyer/dashboard", supplier: "/supplier/dashboard", admin: "/admin/dashboard" };

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(email, password, role);
      navigate(ROLE_HOME[user.role] || "/");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold text-primary-800">Log in to AeroRUL</h1>
        <p className="mt-1 text-sm text-neutral-500">Demo login — any email/password works.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">I am a</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="buyer">Buyer (Airline / MRO)</option>
              <option value="supplier">Supplier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-critical">{error}</p>}
          <button type="submit" className="btn-primary w-full">Log In</button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-500">
          No account? <Link to="/register" className="text-accent hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
