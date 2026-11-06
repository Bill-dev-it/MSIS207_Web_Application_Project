import { useState } from "react";
import { updateSupplierOrderStatus } from "../../../services/supplierOrderService";

const nextStatus = { CONFIRMED: "PROCESSING", PROCESSING: "SHIPPED", SHIPPED: "DELIVERED" };

export default function OrderStatusButton({ order, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const next = nextStatus[order.status];
  if (!next) return null;

  const isPaymentSucceeded = order.payment_status === "SUCCEEDED";
  const blockedMessage =
    order.payment_status === "CANCELLED"
      ? "Payment cancelled — fulfillment actions are disabled for this order."
      : order.payment_status === "PENDING"
      ? "Awaiting payment confirmation — fulfillment cannot advance until payment is SUCCEEDED."
      : "Payment is not confirmed as SUCCEEDED — fulfillment actions are disabled.";

  async function advance() {
    if (!isPaymentSucceeded) return;
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
      <button
        type="button"
        className="btn btn-primary"
        disabled={saving || !isPaymentSucceeded}
        onClick={advance}
      >
        {saving ? "Updating..." : `Mark as ${next}`}
      </button>
      {!isPaymentSucceeded && (
        <p role="note" className="mt-2 text-xs font-medium text-amber-900">
          {blockedMessage}
        </p>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-critical">{error}</p>}
    </div>
  );
}
