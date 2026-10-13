import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { orderApi } from "../../services/orderApi";
import CheckoutStepper from "../../components/order/CheckoutStepper";
import { formatCurrency } from "../../utils/format";
import EmptyState from "../../components/common/EmptyState";

const STEPS = ["Shipping Address", "Delivery Method", "Payment", "Review Order"];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [shipping, setShipping] = useState({
    companyName: "",
    taxId: "",
    purchaseRef: "",
    address: "",
    deliveryMethod: "Standard (5-7 days)",
  });
  const navigate = useNavigate();

  if (items.length === 0) {
    return <EmptyState title="Nothing to check out" description="Your cart is empty." />;
  }

  function set(key, value) {
    setShipping((s) => ({ ...s, [key]: value }));
  }

  async function handlePlaceOrder() {
    setPlacing(true);
    const order = await orderApi.placeOrder(items, shipping);
    clearCart();
    navigate(`/buyer/orders/${order.id}?justPlaced=1`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-primary-800">Checkout</h1>
      <CheckoutStepper steps={STEPS} currentStep={step} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card space-y-4 p-5">
          {step === 0 && (
            <div className="space-y-3">
              <div>
                <label className="label">Company Name</label>
                <input className="input" value={shipping.companyName} onChange={(e) => set("companyName", e.target.value)} />
              </div>
              <div>
                <label className="label">Business / Tax ID</label>
                <input className="input" value={shipping.taxId} onChange={(e) => set("taxId", e.target.value)} />
              </div>
              <div>
                <label className="label">Purchase Reference (PO number)</label>
                <input className="input" value={shipping.purchaseRef} onChange={(e) => set("purchaseRef", e.target.value)} />
              </div>
              <div>
                <label className="label">Shipping Address</label>
                <textarea className="input" rows={3} value={shipping.address} onChange={(e) => set("address", e.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              {["Standard (5-7 days)", "Express (2-3 days)", "Freight (heavy/oversized parts)"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 rounded-[10px] border border-neutral-200 p-3 text-sm">
                  <input
                    type="radio"
                    checked={shipping.deliveryMethod === opt}
                    onChange={() => set("deliveryMethod", opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-500">Payment simulation — no real charge is made in this demo.</p>
              <div>
                <label className="label">Card Number</label>
                <input className="input" placeholder="4242 4242 4242 4242" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Expiry</label>
                  <input className="input" placeholder="MM/YY" />
                </div>
                <div>
                  <label className="label">CVC</label>
                  <input className="input" placeholder="123" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              <p><span className="text-neutral-500">Ship to:</span> {shipping.companyName || "—"}, {shipping.address || "—"}</p>
              <p><span className="text-neutral-500">Delivery:</span> {shipping.deliveryMethod}</p>
              <div className="divide-y divide-neutral-200 border-t border-neutral-200">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between py-2">
                    <span>{product.name} × {quantity}</span>
                    <span>{formatCurrency(product.price * quantity, product.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button className="btn-secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Continue</button>
            ) : (
              <button className="btn-primary" onClick={handlePlaceOrder} disabled={placing}>
                {placing ? "Placing Order…" : "Place Order"}
              </button>
            )}
          </div>
        </div>

        <div className="card h-fit p-4">
          <p className="mb-2 font-semibold text-primary-800">Order Summary</p>
          <div className="space-y-1 text-sm text-neutral-500">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between">
                <span>{product.name} × {quantity}</span>
                <span>{formatCurrency(product.price * quantity, product.currency)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-sm font-semibold text-primary-800">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
