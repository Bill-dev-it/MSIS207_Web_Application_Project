import { formatCurrency } from "../../../cart/utils/cartCalculations";

export default function OrderPaymentInformation({ payment, purchaseReference, grandTotal }) {
  const getMethodName = (method) => {
    switch (method) {
      case "CORPORATE_TERMS":
        return "Corporate Credit Line (Net 30 Invoicing)";
      case "SIMULATION":
        return "AeroRUL Simulated Escrow Authorization";
      default:
        return method || "Corporate Credit Terms";
    }
  };

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Commercial Settlement & PO
      </h3>
      <div className="text-xs text-slate-700 leading-relaxed pt-1 space-y-1.5">
        <div>
          <span className="text-slate-400 font-semibold block">Settlement Method</span>
          <span className="font-bold text-slate-900 block">
            {getMethodName(payment?.payment_method)}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Purchase Order Ref #</span>
          <span className="font-mono font-bold text-blue-700 block">
            {purchaseReference || "None Provided (Direct Commercial PO)"}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Payment Status</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
            <span>✓</span>
            <span>{payment?.status === "SUCCEEDED" ? "Settlement Authorized" : "Pending Verification"}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

