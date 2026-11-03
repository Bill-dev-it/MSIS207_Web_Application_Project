import { useState } from "react";
import { hideSupplierListing } from "../../../services/supplierService";

export default function HideListingButton({ listingId, onHidden }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function hide() {
    if (!window.confirm("Hide this listing from the public marketplace?")) return;
    setBusy(true);
    setError("");
    try {
      await hideSupplierListing(listingId);
      onHidden();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" className="btn btn-secondary" disabled={busy} onClick={hide}>
        {busy ? "Hiding..." : "Hide Listing"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-critical">{error}</p>}
    </div>
  );
}
