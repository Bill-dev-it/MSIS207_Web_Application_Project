import OrderStatusBadge from "../../components/OrderStatusBadge";
import { formatCurrency } from "../../../cart/utils/cartCalculations";

export default function SupplierShipmentCard({ sellerOrder }) {
  const {
    supplier_name_snapshot,
    status,
    subtotal,
    carrier,
    tracking_number,
    items = [],
  } = sellerOrder;

  return (
    <article className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs">
            S
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {supplier_name_snapshot}
            </h3>
            <p className="text-[11px] text-slate-500">Supplier</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <OrderStatusBadge status={status} />
        </div>
      </div>

      {/* Tracking Banner if available */}
      {tracking_number && (
        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-purple-700 font-bold">📦 Carrier Dispatch:</span>
            <span className="font-semibold text-slate-800">{carrier}</span>
          </div>
          <div className="font-mono font-bold text-purple-800">
            Waybill # {tracking_number}
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.order_item_id} className="py-3 flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1 flex-shrink-0">
              <span aria-hidden="true" className="text-xs font-semibold text-slate-400">Part</span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {item.product_name_snapshot}
              </h4>
              <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                P/N {item.part_number_snapshot}{item.seller_sku_snapshot ? ` • SKU: ${item.seller_sku_snapshot}` : ""}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded">
                  {item.condition_snapshot}
                </span>
                <span>•</span>
                <span>Unit: {formatCurrency(item.unit_price)}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-xs font-black font-mono text-slate-900">
                {formatCurrency(item.line_total)}
              </p>
              <p className="text-[11px] text-slate-500">
                Qty: {item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Subtotal footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <span>Consignment Subtotal ({items.length} {items.length === 1 ? "line item" : "line items"})</span>
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(subtotal)}
        </span>
      </div>
    </article>
  );
}
