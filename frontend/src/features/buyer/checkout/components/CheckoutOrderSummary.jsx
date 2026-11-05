import { formatCurrency } from "../../cart/utils/cartCalculations";

export default function CheckoutOrderSummary({
  items = [],
  subtotal = 0,
  shippingFee = 0,
  deliveryMethodName = "Not selected",
  purchaseReference = "",
  currentStep = 2,
}) {
  const grandTotal = Number(subtotal) + Number(shippingFee);

  return (
    <aside className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm sticky top-24">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4 flex items-center justify-between">
        <span>Order Summary</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </h2>

      {/* Mini Cart Items Preview */}
      <div className="mt-4 max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-3">
        {items.map((item) => (
          <div key={item.cart_item_id} className="pt-3 first:pt-0 flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1 flex-shrink-0">
              <span aria-hidden="true" className="text-xs font-semibold text-slate-400">Part</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {item.product_name}
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                P/N {item.part_number} • Qty {item.quantity}
              </p>
              <p className="text-[11px] text-slate-400">
                {item.supplier_name}
              </p>
            </div>
            <p className="text-xs font-bold font-mono text-slate-900 flex-shrink-0">
              {formatCurrency(item.line_total)}
            </p>
          </div>
        ))}
      </div>

      {/* Financial Calculations */}
      <dl className="mt-6 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <dt>Parts Subtotal</dt>
          <dd className="font-semibold text-slate-900 font-mono">
            {formatCurrency(subtotal)}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-1">
            <span>Shipping ({deliveryMethodName})</span>
          </dt>
          <dd className="font-semibold text-slate-900 font-mono">
            {formatCurrency(shippingFee)}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt>Taxes & regulatory fees</dt>
          <dd className="text-slate-500 font-medium">Not calculated</dd>
        </div>

        {purchaseReference && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <dt className="text-slate-500">PO Number</dt>
            <dd className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
              {purchaseReference}
            </dd>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between text-sm">
          <dt className="font-bold text-slate-900">Estimated total</dt>
          <dd className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {formatCurrency(grandTotal)}
          </dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
        Freight is a demonstration estimate and taxes are not calculated here.
      </p>
    </aside>
  );
}
