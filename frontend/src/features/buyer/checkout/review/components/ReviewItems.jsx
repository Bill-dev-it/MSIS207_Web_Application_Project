import { Link } from "react-router-dom";
import { formatCurrency } from "../../../cart/utils/cartCalculations";

export default function ReviewItems({ items = [] }) {
  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">
          1. Aerospace Components & Spares ({items.length})
        </h2>
        <Link
          to="/cart"
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Edit Cart
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.cart_item_id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 flex-shrink-0">
              <span aria-hidden="true" className="text-sm font-semibold text-slate-400">Part</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                {item.product_name}
              </h3>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                P/N {item.part_number}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">{item.supplier_name}</span>
                <span>•</span>
                <span>Condition: <strong className="text-slate-800">{item.condition}</strong></span>
                <span>•</span>
                <span>Unit: {formatCurrency(item.unit_price)}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-sm font-black font-mono text-slate-900">
                {formatCurrency(item.line_total)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Qty: {item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
