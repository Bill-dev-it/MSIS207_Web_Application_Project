import { Link } from "react-router-dom";

export default function ReviewPayment({ company, paymentMethodId, purchaseReference }) {
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

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
            Payment & PO Match
          </span>
          <p className="font-bold text-slate-900 text-sm">
            {paymentMethodId === "SIMULATION" ? "Simulated payment (development only)" : "Unsupported payment method"}
          </p>
          <p className="text-slate-600">
            Purchase reference:{" "}
            <span className="font-mono font-bold text-blue-700">
              {purchaseReference || "None"}
            </span>
          </p>
          <p className="pt-1 text-amber-800">No real payment is processed.</p>
        </div>
      </div>
    </section>
  );
}
