import { Link } from "react-router-dom";

export function RecentOrders({ orders }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recent Procurement Orders
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active replacement parts orders and fulfillment status
          </p>
        </div>
        <Link
          to="/orders"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All Orders &rarr;
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No orders found. Browse the marketplace to source compatible spare parts.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {orders.map((order) => (
            <div
              key={order.order_id}
              className="p-4 hover:bg-slate-50/50 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/orders/${order.order_id}`}
                    className="font-mono text-xs font-bold text-slate-900 hover:text-blue-600"
                  >
                    {order.order_number}
                  </Link>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {order.primary_status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {order.total_items} items &bull; Suppliers: {order.suppliers_list}
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-900">
                  ${Number(order.grand_total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="block text-[11px] text-slate-400">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

