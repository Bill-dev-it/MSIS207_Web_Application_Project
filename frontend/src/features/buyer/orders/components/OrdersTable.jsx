import { Link } from "react-router-dom";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatCurrency } from "../../cart/utils/cartCalculations";

export default function OrdersTable({ orders = [] }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">No Orders Located</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
          No procurement transactions match your active status filters or search query.
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
        >
          Explore Catalog Spares
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-6">Order ID & PO Ref</th>
              <th className="py-3.5 px-6">Date Placed</th>
              <th className="py-3.5 px-6">Components & Suppliers</th>
              <th className="py-3.5 px-6">Total Amount</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((ord) => {
              const formattedDate = new Date(ord.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <tr key={ord.order_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <Link
                      to={`/orders/${ord.order_id}`}
                      className="font-mono font-bold text-slate-900 hover:text-blue-600 text-sm block"
                    >
                      {ord.order_number}
                    </Link>
                    {ord.purchase_reference && (
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        Ref: {ord.purchase_reference}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                    {formattedDate}
                  </td>

                  <td className="py-4 px-6 max-w-xs">
                    <p className="font-semibold text-slate-800">
                      {ord.total_items} {ord.total_items === 1 ? "part" : "parts"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate" title={ord.suppliers_list}>
                      {ord.suppliers_list}
                    </p>
                  </td>

                  <td className="py-4 px-6 font-mono font-black text-slate-900 whitespace-nowrap text-sm">
                    {formatCurrency(ord.grand_total)}
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <OrderStatusBadge status={ord.primary_status} />
                  </td>

                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <Link
                      to={`/orders/${ord.order_id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-lg text-xs transition border border-slate-200 inline-block"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

