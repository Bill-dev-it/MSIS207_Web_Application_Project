import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/cartCalculations";

export default function CartSummary({
  subtotal = 0,
  itemCount = 0,
  purchaseReference = "",
  onPurchaseReferenceChange,
  isUpdating = false,
  checkoutDisabled = false,
}) {
  const navigate = useNavigate();

  const handleProceed = () => {
    navigate("/checkout/shipping");
  };

  return (
    <aside className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm sticky top-24">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4">
        Order Summary
      </h2>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <dt>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</dt>
          <dd className="font-semibold text-slate-900 font-mono">
            {formatCurrency(subtotal)}
          </dd>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <dt className="flex items-center gap-1">
            <span>Estimated Freight</span>
            <span className="text-[11px] text-slate-400" title="Calculated based on delivery method selected at next step">ⓘ</span>
          </dt>
          <dd className="text-xs text-slate-500 font-medium">
            Calculated at next step
          </dd>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <dt>Applicable Taxes & Duties</dt>
          <dd className="text-xs text-slate-500 font-medium">
            Not calculated
          </dd>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
          <dt className="text-base font-bold text-slate-900">Parts subtotal</dt>
          <dd className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatCurrency(subtotal)}
          </dd>
        </div>
      </dl>

      {/* PO Reference Input */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <label
          htmlFor="purchase-ref-input"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Purchase Order / Ref #
        </label>
        <input
          id="purchase-ref-input"
          type="text"
          maxLength={100}
          value={purchaseReference}
          onChange={(e) => onPurchaseReferenceChange?.(e.target.value)}
          placeholder="e.g. PO-2026-CFM-08"
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Optional order reference (up to 100 characters).
        </p>
      </div>

      {/* Proceed Button */}
      <div className="mt-6">
        <button
          type="button"
          disabled={itemCount === 0 || isUpdating || checkoutDisabled}
          onClick={handleProceed}
          className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Proceed to Checkout</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
        Final availability and pricing are revalidated when the order is submitted.
      </p>
    </aside>
  );
}
