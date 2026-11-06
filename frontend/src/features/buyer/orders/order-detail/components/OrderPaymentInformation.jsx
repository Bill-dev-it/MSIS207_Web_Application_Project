import { formatCurrency } from "../../../cart/utils/cartCalculations";

export default function OrderPaymentInformation({
  payment,
  paymentMethod,
  paymentStatus,
  paidAt: topLevelPaidAt,
  orderNumber,
  currency = "USD",
  purchaseReference,
  grandTotal,
}) {
  const method = payment?.payment_method ?? paymentMethod ?? null;
  const status = payment?.status ?? paymentStatus ?? null;
  const paidAt = payment?.paid_at ?? topLevelPaidAt ?? null;
  const amount = payment?.amount ?? grandTotal;
  const resolvedCurrency = payment?.currency || currency || "USD";
  const transferReference = payment?.transfer_reference || orderNumber || "N/A";

  const getMethodName = () => {
    if (method === "SIMULATION") return "Simulated Payment";
    if (method === "BANK_TRANSFER") return "Bank Transfer (Demo)";
    return method ? `Recorded payment method: ${method}` : "Not recorded";
  };

  const getStatusPresentation = () => {
    if (method === "BANK_TRANSFER" && status === "PENDING") {
      return {
        label: "Awaiting Payment Confirmation",
        badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
      };
    }
    if (method === "SIMULATION" && status === "SUCCEEDED") {
      return {
        label: "Simulated Payment Successful",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
    if (method === "BANK_TRANSFER" && status === "SUCCEEDED") {
      return {
        label: "Payment Confirmed (Demo)",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
    if (status === "CANCELLED") {
      return {
        label: "Payment Cancelled",
        badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
      };
    }
    return {
      label: status || "Not recorded",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    };
  };

  const statusPresentation = getStatusPresentation();

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
        Payment & Purchase Reference
      </h3>
      <div className="text-xs text-slate-700 leading-relaxed space-y-2.5">
        <div>
          <span className="text-slate-400 font-semibold block">Settlement Method</span>
          <span className="font-bold text-slate-900 block">
            {getMethodName()}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Payment Status</span>
          <span
            className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full border text-[11px] mt-0.5 ${statusPresentation.badgeClass}`}
          >
            {statusPresentation.label}
          </span>
        </div>

        {amount != null && (
          <div>
            <span className="text-slate-400 font-semibold block">Payment Amount ({resolvedCurrency})</span>
            <span className="font-mono font-bold text-slate-900 block">
              {formatCurrency(amount)} {resolvedCurrency}
            </span>
          </div>
        )}

        {method === "BANK_TRANSFER" && (
          <div>
            <span className="text-slate-400 font-semibold block">
              Demonstration Transfer Reference
            </span>
            <span className="font-mono font-bold text-slate-900 block">
              {transferReference}
            </span>
          </div>
        )}

        <div>
          <span className="text-slate-400 font-semibold block">Purchase Order Ref #</span>
          <span className="font-mono font-bold text-blue-700 block">
            {purchaseReference || "None"}
          </span>
        </div>

        {paidAt && status === "SUCCEEDED" && (
          <div>
            <span className="text-slate-400 font-semibold block">Payment Timestamp</span>
            <span className="font-medium text-slate-800 block">
              {new Date(paidAt).toLocaleString()}
            </span>
          </div>
        )}

        {method === "BANK_TRANSFER" && status === "PENDING" && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1 text-slate-800" role="note">
            <p>
              Use order number <strong className="font-mono">{transferReference}</strong> as the demonstration transfer reference for{" "}
              <strong className="font-mono">{formatCurrency(amount)} {resolvedCurrency}</strong>.
            </p>
            <p>
              Supplier processing is blocked until payment confirmation is recorded by an administrator.
            </p>
            <p className="font-bold text-amber-900">
              Demo only — do not transfer real money.
            </p>
          </div>
        )}

        {method === "SIMULATION" && status === "SUCCEEDED" && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700" role="note">
            Simulated Payment Successful. No real money was transferred.
          </p>
        )}

        {method === "BANK_TRANSFER" && status === "SUCCEEDED" && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-slate-800" role="note">
            Payment Confirmed (Demo). No real money was transferred.
          </p>
        )}

        {status === "CANCELLED" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-1 text-rose-900" role="note">
            <p className="font-bold">Payment Cancelled</p>
            <p>
              This order is not paid and cannot proceed to Supplier fulfillment.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
