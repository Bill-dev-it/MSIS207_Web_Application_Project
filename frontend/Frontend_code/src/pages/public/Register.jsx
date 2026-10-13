import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ROLE_HOME = { buyer: "/buyer/dashboard", supplier: "/supplier/dashboard" };

export default function Register() {
  const [form, setForm] = useState({ role: "buyer", companyName: "", email: "", password: "" });
  const { register } = useAuth();
  const navigate = useNavigate();

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const user = await register(form);
    navigate(ROLE_HOME[user.role] || "/");
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-xl font-semibold text-primary-800">Create an account</h1>
        <p className="mt-1 text-sm text-neutral-500">Register your company to start buying or selling.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">Account type</label>
            <div className="flex gap-2">
              {["buyer", "supplier"].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => set("role", r)}
                  className={form.role === r ? "btn-primary flex-1 !py-1.5 text-sm capitalize" : "btn-secondary flex-1 !py-1.5 text-sm capitalize"}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Company name</label>
            <input className="input" required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </div>
          <div>
            <label className="label">Work email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full">Create Account</button>
        </form>
      </div>
    </div>
  );
}
