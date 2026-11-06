import { Link } from "react-router-dom";
import { getPaymentMethodMeta } from "../../payment/services/paymentApi";

export default function ReviewPayment({ company, paymentMethodId, purchaseReference }) {
  const methodMeta = getPaymentMethodMeta(paymentMethodId);
  const isBankTransfer = paymentMethodId === "BANK_TRANSFER";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">
          Buyer company & payment
        </h2>
        <Link
          to="/checkout/payment"
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Change
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
            Purchasing Entity
          </span>
          <p className="font-bold text-slate-900 text-sm">
            {company?.company_name || "Company details unavailable"}
          </p>
          {company?.company_type && <p className="text-slate-600">Account type: {company.company_type}</p>}
          {company?.country_code && <p className="text-slate-600">Country: {company.country_code}</p>}
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
            Payment & PO Match
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900 text-sm">
              {methodMeta ? methodMeta.name : "Unsupported payment method"}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                isBankTransfer
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {isBankTransfer ? "Initial state: PENDING" : "Initial state: SUCCEEDED (Demo)"}
            </span>
          </div>
          <p className="text-slate-600">
            Purchase reference:{" "}
            <span className="font-mono font-bold text-blue-700">
              {purchaseReference || "None"}
            </span>
          </p>
          <p className="pt-1 text-slate-700">
            {isBankTransfer
              ? "Order is placed with payment PENDING (paid_at = null) until an administrator confirms it in the demonstration system. Supplier fulfillment is blocked until confirmation."
              : "The system records a successful test payment immediately at checkout. No money is transferred."}
          </p>
          <p className="font-semibold text-amber-900">
            {isBankTransfer
              ? "Demo only — do not transfer real money."
              : "No real payment is processed."}
          </p>
        </div>
      </div>
    </section>
  );
}
