import { Link } from "react-router-dom";

export function RecentOrders({ orders = [] }) {
  function getOrderStatusBadge(status) {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCEEDED" || s === "PAID" || s === "COMPLETED") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
          {status}
        </span>
      );
    }
    if (s === "CONFIRMED") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
          {status}
        </span>
      );
    }
    if (s === "PENDING" || s === "SUBMITTED") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
          {status}
        </span>
      );
    }
    if (s === "PROCESSING") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
          {status}
        </span>
      );
    }
    if (s === "CANCELLED" || s === "FAILED") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
          {status}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
        {status || "UNKNOWN"}
      </span>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recent Orders
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Procurement orders &amp; supplier fulfillment status
          </p>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 transition-colors"
        >
          <span>View all orders</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center grow">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-800">No procurement orders yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Source replacement parts, turbine blades, and avionics directly from verified suppliers.
          </p>
          <Link
            to="/marketplace"
            className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0B1F3A] text-white hover:bg-slate-800 transition-colors"
          >
            Browse Marketplace &rarr;
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 grow">
          {orders.map((order) => (
            <div
              key={order.order_id}
              className="p-4 hover:bg-slate-50/70 flex items-start justify-between gap-3 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/orders/${encodeURIComponent(order.order_id)}`}
                    className="font-mono text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline"
                  >
                    {order.order_number}
                  </Link>
                  {getOrderStatusBadge(order.primary_status)}
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {order.total_items} {order.total_items === 1 ? "item" : "items"}
                  {order.suppliers_list && (
                    <span> &bull; Supplier: <span className="font-medium text-slate-700">{order.suppliers_list}</span></span>
                  )}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-xs font-bold text-slate-900 block">
                  ${Number(order.grand_total || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
