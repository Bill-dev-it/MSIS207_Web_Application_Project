import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchBuyerOrders } from "../../../services/buyerService";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { TechIcon } from "../../../components/common/TechIcons";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      try {
        setLoading(true);
        const data = await fetchBuyerOrders({
          statusFilter,
          searchQuery,
          page,
          pageSize: 10,
        });
        if (active) {
          setOrders(data.items);
          setStatusCounts(data.statusCounts);
          setPagination(data.pagination);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load purchase orders");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOrders();
    return () => { active = false; };
  }, [statusFilter, searchQuery, page]);

  const tabs = [
    { id: "ALL", label: "All Orders", count: pagination.total },
    { id: "CONFIRMED", label: "Confirmed", count: statusCounts.CONFIRMED || 0 },
    { id: "PROCESSING", label: "Processing", count: statusCounts.PROCESSING || 0 },
    { id: "SHIPPED", label: "In Transit", count: statusCounts.SHIPPED || 0 },
    { id: "DELIVERED", label: "Delivered", count: statusCounts.DELIVERED || 0 },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Purchase Orders Dossier</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Procurement requisitions, commercial invoices, and air-courier tracking logs.
          </p>
        </div>
        <Link
          to="/marketplace"
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
        >
          <span>Procure New Spares →</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-[#0D1829] border border-slate-800">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setStatusFilter(t.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 ${
                statusFilter === t.id
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{t.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                statusFilter === t.id ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search PO # or supplier..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0D1829] border border-slate-800 text-xs font-mono text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
          />
          <TechIcon name="Search" className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0D1829]/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#091024] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order Number</th>
                <th className="py-3.5 px-4">PO Reference</th>
                <th className="py-3.5 px-4">Suppliers Involved</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Date Logged</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                      <span>Querying purchase orders ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-red-400">{error}</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No purchase orders found matching filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-cyan-400">{ord.orderNumber}</td>
                    <td className="py-3.5 px-4 text-slate-300">{ord.purchaseReference || "Standard PO"}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-200">
                      {ord.supplierNames?.join(", ") || "Aero Supply Network"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{ord.itemCount} units</td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      ${Number(ord.grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ord.status} type="order" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/buyer/orders/${ord.orderNumber}`)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-cyan-300 text-[11px] font-medium transition"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
