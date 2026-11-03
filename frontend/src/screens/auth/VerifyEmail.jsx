import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyEmailToken } from "../../services/authApi";
import AuthScreenFrame from "./AuthScreenFrame";
import ResendVerificationForm from "./ResendVerificationForm";

export default function VerifyEmail() {
  const navigate = useNavigate();
  // Capture once, then remove the sensitive token from the browser URL.
  // Requiring an explicit click avoids accidental verification on page prefetch
  // or React.StrictMode development effect replays.
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") || "");
  const [status, setStatus] = useState(token ? "ready" : "missing");
  const [error, setError] = useState("");
  useEffect(() => {
    if (token) navigate("/verify-email", { replace: true });
  }, [navigate, token]);

  async function confirm() {
    if (!/^[0-9a-f]{64}$/.test(token)) {
      setStatus("invalid");
      setError("The verification link is invalid.");
      return;
    }
    setStatus("checking");
    setError("");
    try {
      await verifyEmailToken(token);
      setStatus("verified");
    } catch (err) {
      setStatus("invalid");
      setError(err.message || "This link could not be verified.");
    }
  }

  return (
    <AuthScreenFrame eyebrow="Email verification" title="Verify your email" description="Confirm your business email before logging in to AeroRUL.">
      {status === "ready" && <button type="button" className="btn btn-primary w-full" onClick={confirm}>Verify my email</button>}
      {status === "checking" && <p role="status">Checking your verification link…</p>}
      {status === "verified" && <div className="space-y-3"><p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">Email verified. You can now log in.</p><Link to="/login" className="btn btn-primary">Continue to login</Link></div>}
      {(status === "invalid" || status === "missing") && <div className="space-y-4"><p role="alert" className="text-sm text-red-700">{error || "This page needs a valid verification link from your email."}</p><ResendVerificationForm /></div>}
    </AuthScreenFrame>
  );
}
