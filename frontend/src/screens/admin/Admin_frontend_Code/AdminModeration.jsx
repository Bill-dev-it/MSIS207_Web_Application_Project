import { useEffect, useState, useMemo } from "react";
import { fetchModerationQueue, submitModerationDecision } from "../../../services/adminService";
import { ModerationFilterBar } from "../../../components/moderation/ModerationFilterBar";
import { ModerationDetailModal } from "../../../components/moderation/ModerationDetailModal";
import { useToast } from "../../../components/ui/Toast";

export default function AdminModeration() {
  const toast = useToast();
  const [status, setStatus] = useState("DRAFT");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQueue = async (targetStatus = status, targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchModerationQueue({ status: targetStatus, page: targetPage, pageSize: 20 });
      setItems(res.items || []);
      setPagination(res.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load moderation queue");
      toast.error(err.message || "Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue(status, 1);
  }, [status]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((it) => {
      const pName = (it.productName || it.product?.productName || "").toLowerCase();
      const pNum = (it.partNumber || it.product?.partNumber || "").toLowerCase();
      const sName = (it.supplierName || it.supplier?.storeName || "").toLowerCase();
      const sku = (it.sellerSku || "").toLowerCase();
      return pName.includes(q) || pNum.includes(q) || sName.includes(q) || sku.includes(q);
    });
  }, [items, searchQuery]);

  const handleDecision = async (listingId, decision, note) => {
    setIsSubmitting(true);
    // Optimistic UI state
    const previousItems = [...items];
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));

    try {
      await submitModerationDecision(listingId, decision, note);
      toast.success(
        `Listing #${listingId} marked as ${decision}. Audit log created.`
      );
      setSelectedItem(null);
      // Reload count
      loadQueue(status, pagination.page);
    } catch (err) {
      // Rollback
      setItems(previousItems);
      toast.error(err.message || "Moderation action failed. Changes reverted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-400">
              GATEKEEPER COMPLIANCE CONSOLE
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Product & Supplier Moderation
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Review airworthiness certifications, pricing fairness, and supplier catalog submissions.
          </p>
        </div>

        <button
          onClick={() => loadQueue(status, pagination.page)}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <ModerationFilterBar
        activeStatus={status}
        onStatusChange={(newStatus) => {
          setStatus(newStatus);
          setSearchQuery("");
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={pagination.total}
      />

      {/* Main Table / Queue */}
      <div className="rounded-2xl bg-[#091024] border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto"></div>
            <p className="text-xs font-mono text-slate-400">Loading catalog moderation queue...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-400 space-y-2">
            <p className="text-sm font-bold font-mono">Error loading queue</p>
            <p className="text-xs text-slate-400 font-mono">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white">No items found</p>
            <p className="text-xs text-slate-500 font-mono">
              There are no listings matching status "{status}".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0c1530] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Listing ID</th>
                  <th className="py-3 px-4">Component & Part #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => (
                  <tr key={item.listingId} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-cyan-400">
                      #{item.listingId}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-white">
                        {item.productName || item.product?.productName || "Component"}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                        P/N: {item.partNumber || item.product?.partNumber || "N/A"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-300">
                      {item.supplierName || item.supplier?.storeName || `Supplier #${item.supplierId}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {item.condition || "New"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.quantityAvailable ?? item.stock ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ${Number(item.price || item.unitPrice || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono text-[11px] font-bold transition"
                      >
                        Inspect & Decide
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800/80 bg-slate-900/40 text-xs font-mono text-slate-400">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadQueue(status, pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => loadQueue(status, pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Inspection & Decision Modal */}
      {selectedItem && (
        <ModerationDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDecision={handleDecision}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
