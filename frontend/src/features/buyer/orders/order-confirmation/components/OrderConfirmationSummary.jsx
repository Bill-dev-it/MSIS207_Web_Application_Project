import OrderStatusBadge from "../../components/OrderStatusBadge";
import { formatCurrency } from "../../../cart/utils/cartCalculations";

function getPaymentPresentation(method, status) {
  if (method === "BANK_TRANSFER" && status === "PENDING") {
    return {
      methodLabel: "Bank Transfer (Demo)",
      statusLabel: "Awaiting Payment Confirmation",
      badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
      panelClass: "border-amber-300 bg-amber-50/70 text-slate-900",
    };
  }
  if (method === "SIMULATION" && status === "SUCCEEDED") {
    return {
      methodLabel: "Simulated Payment",
      statusLabel: "Simulated Payment Successful",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      panelClass: "border-slate-200 bg-slate-50 text-slate-900",
    };
  }
  if (method === "BANK_TRANSFER" && status === "SUCCEEDED") {
    return {
      methodLabel: "Bank Transfer (Demo)",
      statusLabel: "Payment Confirmed (Demo)",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      panelClass: "border-emerald-200 bg-emerald-50/50 text-slate-900",
    };
  }
  if (status === "CANCELLED") {
    return {
      methodLabel:
        method === "BANK_TRANSFER"
          ? "Bank Transfer (Demo)"
          : method || "Recorded payment",
      statusLabel: "Payment Cancelled",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
      panelClass: "border-rose-200 bg-rose-50/60 text-slate-900",
    };
  }
  return {
    methodLabel:
      method === "BANK_TRANSFER"
        ? "Bank Transfer (Demo)"
        : method === "SIMULATION"
        ? "Simulated Payment"
        : "Not recorded",
    statusLabel: status || "Payment status not recorded",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    panelClass: "border-slate-200 bg-slate-50 text-slate-900",
  };
}

export default function OrderConfirmationSummary({ order }) {
  const addr = order?.shipping_address_snapshot;
  const paymentMethod = order?.payment_method ?? order?.payment?.payment_method ?? null;
  const paymentStatus = order?.payment_status ?? order?.payment?.status ?? null;
  const paidAt = order?.paid_at ?? order?.payment?.paid_at ?? null;
  const paymentInfo = getPaymentPresentation(paymentMethod, paymentStatus);
  const currency = order?.currency || "USD";
  const amountValue = order?.payment_amount ?? order?.payment?.amount ?? order?.grand_total;
  const transferRef =
    order?.transfer_reference ||
    order?.payment?.transfer_reference ||
    order?.order_number;

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs border-b border-slate-100 pb-6">
        <div>
          <span className="text-slate-400 font-semibold block">Order Number</span>
          <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
            {order.order_number}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Order Total ({currency})</span>
          <span className="font-mono font-black text-slate-900 text-sm mt-0.5 block">
            {formatCurrency(order.grand_total)} {currency}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Order Status</span>
          <div className="mt-1">
            <OrderStatusBadge status={order.primary_status || "CONFIRMED"} />
          </div>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Payment Status</span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] border inline-block mt-1 ${paymentInfo.badgeClass}`}
          >
            {paymentInfo.statusLabel}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">PO Reference</span>
          <span className="font-mono font-bold text-blue-700 text-xs mt-0.5 block">
            {order.purchase_reference || "None"}
          </span>
        </div>
      </div>

      {/* Contextual Payment Status & Reference Box */}
      <div className={`rounded-xl border p-4 sm:p-5 space-y-2 text-xs ${paymentInfo.panelClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">
            {paymentInfo.statusLabel} · {paymentInfo.methodLabel}
          </p>
          <span className="font-mono font-bold text-slate-900">
            Amount: {formatCurrency(amountValue)} {currency}
          </span>
        </div>

        {paymentMethod === "BANK_TRANSFER" && paymentStatus === "PENDING" && (
          <>
            <p className="text-slate-800">
              Demonstration transfer reference:{" "}
              <strong className="font-mono text-slate-900">{transferRef}</strong>{" "}
              · Amount due:{" "}
              <strong className="font-mono text-slate-900">
                {formatCurrency(amountValue)} {currency}
              </strong>
            </p>
            <p className="text-slate-700">
              Supplier processing is blocked until payment confirmation is recorded by an administrator in the demonstration system.
            </p>
            <p className="font-bold text-amber-900" role="note">
              Demo only — do not transfer real money.
            </p>
          </>
        )}

        {paymentMethod === "SIMULATION" && paymentStatus === "SUCCEEDED" && (
          <>
            <p className="text-slate-700">
              Simulated Payment Successful. No real money was transferred.
            </p>
            {paidAt && (
              <p className="text-slate-600">
                Recorded at: {new Date(paidAt).toLocaleString()}
              </p>
            )}
          </>
        )}

        {paymentMethod === "BANK_TRANSFER" && paymentStatus === "SUCCEEDED" && (
          <>
            <p className="text-slate-800">
              Payment Confirmed (Demo) for transfer reference{" "}
              <strong className="font-mono text-slate-900">{transferRef}</strong> (
              {formatCurrency(amountValue)} {currency}).
            </p>
            {paidAt && (
              <p className="text-slate-700">
                Confirmed at: <strong>{new Date(paidAt).toLocaleString()}</strong>
              </p>
            )}
            <p className="font-semibold text-amber-900" role="note">
              Demo only — do not transfer real money. No real funds were transferred.
            </p>
          </>
        )}

        {paymentStatus === "CANCELLED" && (
          <>
            <p className="text-rose-900 font-semibold">
              Payment Cancelled. This order is not paid and cannot proceed to Supplier fulfillment.
            </p>
            <p className="text-slate-700">
              Reserved listing inventory has been released. Demo only — do not transfer real money.
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Shipping destination
          </span>
          <p className="font-bold text-slate-900 text-sm">{order.company_name_snapshot}</p>
          <p className="font-semibold text-slate-800">{addr?.recipient_name || "Recipient unavailable"}</p>
          {addr?.address_line && <p>{addr.address_line}</p>}
          {(addr?.city || addr?.country_code) && <p>{[addr.city, addr.region, addr.postal_code, addr.country_code].filter(Boolean).join(", ")}</p>}
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Consignment Breakdown
          </span>
          <p className="font-semibold text-slate-800">
            {order.total_items} {order.total_items === 1 ? "item" : "items"} recorded
          </p>
          <p className="text-slate-500">
            Order fulfillment and delivery details will appear when recorded by suppliers.
          </p>
        </div>
      </div>
    </section>
  );
}
