import { useState } from "react";

export default function PlaceOrderButton({
  onPlaceOrder,
  isSubmitting = false,
  disabled = false,
  paymentMethodId = "SIMULATION",
}) {
  const [agreed, setAgreed] = useState(false);
  const isBankTransfer = paymentMethodId === "BANK_TRANSFER";

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
        />
        <span className="text-xs text-slate-600 leading-relaxed">
          {isBankTransfer
            ? "I confirm the shipping and billing information is accurate. I understand this Bank Transfer (Demo) order will be recorded as PENDING until confirmed by an administrator, and that no real money should be transferred."
            : "I confirm the shipping and billing information is accurate. I understand payment is a demonstration simulation and no real funds will be collected."}
        </span>
      </label>

      <button
        type="button"
        disabled={!agreed || isSubmitting || disabled}
        onClick={onPlaceOrder}
        className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-xl text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing Order Transaction...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Place Procurement Order</span>
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-slate-400">
        {isBankTransfer
          ? "Order and inventory reservations are saved together with payment PENDING. Demo only — do not transfer real money."
          : "Order and inventory updates are saved together. Payment is simulated; no funds are transferred."}
      </p>
    </div>
  );
}
