import { useState } from "react";
import { updateSupplierStock } from "../../../services/supplierService";

export default function StockEditor({ listingId, quantity, onSaved }) {
  const [stock, setStock] = useState(String(quantity));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const next = Number(stock);
    if (!Number.isInteger(next) || next < 0 || next > 2147483647) {
      setError("Stock must be a non-negative integer within database limits.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateSupplierStock(listingId, next);
      onSaved(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
      <div>
        <label className="label" htmlFor={`stock-${listingId}`}>Update stock</label>
        <input id={`stock-${listingId}`} className="input w-28" type="number" min="0" step="1"
          value={stock} onChange={(event) => setStock(event.target.value)} required />
      </div>
      <button type="submit" disabled={saving} className="btn btn-secondary">
        {saving ? "Saving..." : "Save stock"}
      </button>
      {error && <p role="alert" className="w-full text-sm text-critical">{error}</p>}
    </form>
  );
}
