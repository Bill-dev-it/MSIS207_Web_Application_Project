import { formatCurrency } from "../../../cart/utils/cartCalculations";

export default function OrderConfirmationSummary({ order }) {
  let addr = order?.shipping_address_snapshot;
  if (typeof addr === "string") {
    try {
      addr = JSON.parse(addr);
    } catch {
      addr = {};
    }
  }

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-slate-100 pb-6">
        <div>
          <span className="text-slate-400 font-semibold block">Order Number</span>
          <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
            {order.order_number}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Order Total</span>
          <span className="font-mono font-black text-slate-900 text-sm mt-0.5 block">
            {formatCurrency(order.grand_total)}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">Payment Terms</span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
            ✓ {order.payment_method === "CORPORATE_TERMS" ? "Net 30 Invoicing" : "Simulated Escrow"}
          </span>
        </div>

        <div>
          <span className="text-slate-400 font-semibold block">PO Reference</span>
          <span className="font-mono font-bold text-blue-700 text-xs mt-0.5 block">
            {order.purchase_reference || "N/A (Direct PO)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Consignment Recipient & Facility
          </span>
          <p className="font-bold text-slate-900 text-sm">{order.company_name_snapshot}</p>
          <p className="font-semibold text-slate-800">{addr?.recipient_name || "Receiving Facility"}</p>
          <p>{addr?.address_line}</p>
          <p>
            {addr?.city}, {addr?.region} {addr?.postal_code}, {addr?.country_code}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Consignment Breakdown
          </span>
          <p className="font-semibold text-slate-800">
            {order.total_items} {order.total_items === 1 ? "Component / Spare" : "Components / Spares"} Queued
          </p>
          <p className="text-slate-500">
            Fulfillment Priority: Commercial Line Maintenance / Scheduled Overhaul
          </p>
          <p className="text-slate-500">
            Official Invoice dispatched to corporate accounts payable.
          </p>
        </div>
      </div>
    </section>
  );
}

