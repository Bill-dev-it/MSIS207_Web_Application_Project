import { useState } from "react";
import { updateSupplierOrderStatus } from "../../../services/supplierOrderService";

const nextStatus = { CONFIRMED: "PROCESSING", PROCESSING: "SHIPPED", SHIPPED: "DELIVERED" };

export default function OrderStatusButton({ order, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const next = nextStatus[order.status];
  if (!next) return null;

  async function advance() {
    setError("");
    setSaving(true);
    try {
      const updated = await updateSupplierOrderStatus(order.seller_order_id, next);
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5">
      <button type="button" className="btn btn-primary" disabled={saving} onClick={advance}>
        {saving ? "Updating..." : `Mark as ${next}`}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-critical">{error}</p>}
    </div>
  );
}
