import { useState } from "react";
import { Link } from "react-router-dom";
import { registerAccount } from "../../services/authApi";
import { buildRegistrationPayload } from "./registerFields";
import AuthScreenFrame from "./AuthScreenFrame";
import ResendVerificationForm from "./ResendVerificationForm";

const DEFAULTS = {
  account_type: "BUYER", full_name: "", email: "", password: "", confirm_password: "",
  company_name: "", company_type: "AIRLINE", country_code: "VN", tax_id: "", store_name: "",
};

export default function Register() {
  const [fields, setFields] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (event) => setFields((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (fields.password !== fields.confirm_password) {
      setError("The confirmation password does not match.");
      return;
    }
    setBusy(true);
    try {
      const data = await registerAccount(buildRegistrationPayload(fields));
      setResult(data);
      setFields((previous) => ({ ...previous, password: "", confirm_password: "" }));
    } catch (err) {
      setError(err.message || "Registration could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <AuthScreenFrame eyebrow="Registration submitted" title="Check your business email" description="Your company account has been created, but you must verify your email before logging in.">
        <p role="status" className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">{result.email_verification_sent
          ? `A verification message was sent to ${result.email}. Follow its link within 24 hours.`
          : `Your account ${result.email} was created, but the email could not be delivered. Request a new link below.`}</p>
        {result.role === "SUPPLIER" && <p className="text-sm text-neutral-700">After email verification, your supplier company must also be approved before its workspace becomes available.</p>}
        <ResendVerificationForm defaultEmail={result.email} />
        <Link className="btn btn-primary" to="/login">Go to login</Link>
      </AuthScreenFrame>
    );
  }

  return (
    <AuthScreenFrame eyebrow="Join AeroRUL" title="Register your company" description="Create a Buyer or Supplier account. Public registration cannot create Admin accounts.">
      <form onSubmit={submit} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="label">Account type</legend>
          <div className="grid grid-cols-2 gap-2">
            {[{ value: "BUYER", label: "Buyer" }, { value: "SUPPLIER", label: "Supplier" }].map(({ value, label }) => (
              <label key={value} className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${fields.account_type === value ? "border-primary-700 bg-primary-50" : "border-neutral-200"}`}>
                <input type="radio" name="account_type" value={value} checked={fields.account_type === value} onChange={update} />{label}
              </label>
            ))}
          </div>
        </fieldset>
        <div><label className="label" htmlFor="register-name">Full name</label><input className="input" id="register-name" name="full_name" autoComplete="name" required minLength={2} maxLength={150} value={fields.full_name} onChange={update} /></div>
        <div><label className="label" htmlFor="register-email">Business email</label><input className="input" id="register-email" name="email" type="email" autoComplete="email" required maxLength={254} value={fields.email} onChange={update} /></div>
        <div><label className="label" htmlFor="register-company">Company name</label><input className="input" id="register-company" name="company_name" autoComplete="organization" required minLength={2} maxLength={255} value={fields.company_name} onChange={update} /></div>
        {fields.account_type === "BUYER" ? (
          <div><label className="label" htmlFor="register-company-type">Company type</label><select className="input" id="register-company-type" name="company_type" value={fields.company_type} onChange={update}><option value="AIRLINE">Airline</option><option value="MRO">Maintenance, Repair & Overhaul (MRO)</option><option value="MIXED">Mixed operations</option></select></div>
        ) : (
          <div><label className="label" htmlFor="register-store">Supplier store name</label><input className="input" id="register-store" name="store_name" required minLength={2} maxLength={150} value={fields.store_name} onChange={update} /></div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="register-country">Country (ISO 2-letter code)</label><input className="input" id="register-country" name="country_code" required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" autoCapitalize="characters" value={fields.country_code} onChange={update} /></div>
          <div><label className="label" htmlFor="register-tax">Tax ID (optional)</label><input className="input" id="register-tax" name="tax_id" maxLength={100} value={fields.tax_id} onChange={update} /></div>
        </div>
        <div><label className="label" htmlFor="register-password">Password (at least 12 characters)</label><input className="input" id="register-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={fields.password} onChange={update} /></div>
        <div><label className="label" htmlFor="register-confirm">Confirm password</label><input className="input" id="register-confirm" name="confirm_password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={fields.confirm_password} onChange={update} /></div>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button className="btn btn-primary w-full" type="submit" disabled={busy}>{busy ? "Creating account…" : "Register company"}</button>
        <p className="text-xs text-neutral-500">Suppliers are approved separately after email verification. Passwords are never stored in browser storage.</p>
      </form>
      <p className="text-sm text-neutral-700">Already registered? <Link className="font-semibold text-primary-700 underline" to="/login">Log in</Link>.</p>
    </AuthScreenFrame>
  );
}
