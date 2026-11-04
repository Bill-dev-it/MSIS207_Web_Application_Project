import { Link } from "react-router-dom";

export default function ReviewPayment({ company, paymentMethodId, purchaseReference }) {
  const getPaymentLabel = (id) => {
    switch (id) {
      case "NET_30":
        return "Corporate Credit Line (Net 30 Invoicing Terms)";
      case "SIMULATION":
        return "AeroRUL Simulated Escrow Authorization";
      case "WIRE_TRANSFER":
        return "Pre-dispatch Wire Transfer (SWIFT / ACH)";
      default:
        return "Corporate Credit Account";
    }
  };

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">
          3. Corporate Entity & Settlement Terms
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
            {company?.company_name || "Demo Horizon Airlines"}
          </p>
          <p className="text-slate-600">
            Account Type: {company?.company_type || "AIRLINE OPERATOR"}
          </p>
          <p className="text-slate-600">
            Tax / VAT Jurisdiction: {company?.country_code} (B2B Tax Exempt)
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
            Payment & PO Match
          </span>
          <p className="font-bold text-slate-900 text-sm">
            {getPaymentLabel(paymentMethodId)}
          </p>
          <p className="text-slate-600">
            Purchase Reference:{" "}
            <span className="font-mono font-bold text-blue-700">
              {purchaseReference || "None Provided (Direct PO)"}
            </span>
          </p>
          <p className="text-emerald-700 font-medium pt-1">
            ✓ Authorized for procurement fulfillment
          </p>
        </div>
      </div>
    </section>
  );
}

