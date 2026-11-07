import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [role, setRole] = useState("BUYER");
    const [error, setError] = useState("");

    function handleSubmit(event) {
        event.preventDefault();
        setError("");

        try {
            login({ email, role });

            const defaultPath = {
                BUYER: "/buyer",
                ADMIN: "/admin",
                SUPPLIER: "/supplier",
            };

            const destination =
                location.state?.from?.pathname || defaultPath[role];

            navigate(destination, { replace: true });
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <main className="container-page flex min-h-[75vh] items-center justify-center py-12">
            <section className="card w-full max-w-md p-8">
                <h1 className="text-2xl font-bold text-primary-800">
                    Sign in to AeroRUL
                </h1>

                <p className="mt-2 text-sm text-neutral-500">
                    Access your aviation marketplace workspace.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                        <label htmlFor="email" className="label">
                            Email address
                        </label>

                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="role" className="label">
                            Demo account role
                        </label>

                        <select
                            id="role"
                            className="input"
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                        >
                            <option value="BUYER">Buyer</option>
                            <option value="ADMIN">Administrator</option>
                            <option value="SUPPLIER">Supplier</option>
                        </select>
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button type="submit" className="btn-primary w-full">
                        Sign in
                    </button>
                </form>

                <p className="mt-5 text-xs text-neutral-500">
                    Demo authentication only. No real account verification.
                </p>
            </section>
        </main>
    );
}
