import { useEffect, useState } from "react";
import { resendVerificationEmail } from "../../services/authApi";

export default function ResendVerificationForm({ defaultEmail = "" }) {
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { setEmail(defaultEmail); }, [defaultEmail]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const result = await resendVerificationEmail(email.trim());
      setNotice(result?.message || "If this account is eligible, a verification email will be sent.");
    } catch (err) {
      setError(err.message || "Could not request a verification email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <h2 className="text-base font-semibold">Resend verification email</h2>
      <div><label className="label" htmlFor="resend-email">Account email</label><input className="input" id="resend-email" type="email" name="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <button className="btn btn-secondary" type="submit" disabled={busy}>{busy ? "Sending request…" : "Request a new link"}</button>
      {notice && <p className="text-sm text-neutral-700" role="status">{notice}</p>}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </form>
  );
}
