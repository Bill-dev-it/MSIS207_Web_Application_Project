import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchBuyerOrders } from "../../../services/buyerService";

/**
 * Data Mapper: converts raw order data to view-model
 */
function mapOrderToViewModel(raw) {
  const allSuppliers = raw.seller_orders.map((so) => so.supplier_name_snapshot);
  const totalItemCount = raw.seller_orders.reduce(
    (sum, so) => sum + so.items.reduce((iSum, it) => iSum + it.quantity, 0),
    0
  );
  const firstItemName =
    raw.seller_orders[0]?.items[0]?.product_name_snapshot || "Aero Components";

  return {
    id: raw.order_id,
    orderNumber: raw.order_number,
    purchaseReference: raw.purchase_reference,
    placedDate: new Date(raw.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    rawDate: raw.created_at,
    itemCount: totalItemCount,
    itemSummary:
      totalItemCount > 1
        ? `${totalItemCount} items (${firstItemName}, +${totalItemCount - 1} more)`
        : `1 item (${firstItemName})`,
    suppliers: allSuppliers,
    currency: raw.currency || "USD",
    subtotal: raw.subtotal,
    shippingTotal: raw.shipping_total,
    grandTotal: raw.grand_total,
    orderStatus: raw.order_status,
    statusCategory: raw.status_category,
    sellerOrders: raw.seller_orders,
  };
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchBuyerOrders()
      .then((data) => {
        const mapped = data.map(mapOrderToViewModel);
        setOrders(mapped);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load orders");
        setLoading(false);
      });
  }, []);

  // Filter & Search
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      let matchesStatus = true;
      if (statusFilter !== "ALL") {
        matchesStatus =
          ord.statusCategory === statusFilter ||
          ord.orderStatus.toUpperCase().includes(statusFilter);
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.purchaseReference.toLowerCase().includes(q) ||
        ord.suppliers.some((s) => s.toLowerCase().includes(q)) ||
        ord.itemSummary.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: orders.length,
      placed: orders.filter((o) => o.statusCategory === "PLACED").length,
      confirmed: orders.filter((o) => o.statusCategory === "CONFIRMED").length,
      processing: orders.filter((o) => o.statusCategory === "PROCESSING").length,
      shipped: orders.filter((o) => o.statusCategory === "SHIPPED").length,
      delivered: orders.filter((o) => o.statusCategory === "DELIVERED").length,
    };
  }, [orders]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const getStatusBadge = (status, category) => {
    if (category === "DELIVERED" || status.toLowerCase().includes("delivered")) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Delivered
        </span>
      );
    }
    if (category === "SHIPPED" || status.toLowerCase().includes("shipped")) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Shipped
        </span>
      );
    }
    if (category === "PROCESSING" || status.toLowerCase().includes("progress") || status.toLowerCase().includes("processing")) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          In progress
        </span>
      );
    }
    if (category === "CONFIRMED" || status.toLowerCase().includes("confirmed")) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Confirmed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-300">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
        Placed
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0B1F3A] border-t-transparent" />
          <p className="text-sm font-medium text-neutral-500">Loading buyer orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="card max-w-md p-6 text-center">
          <p className="text-base font-semibold text-rose-600">Failed to load orders</p>
          <p className="mt-2 text-sm text-neutral-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0B1F3A] antialiased">
      {/* Sidebar Navigation */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-[#E2E8F0] bg-white px-4 py-6 shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Brand Logo */}
          <Link to="/" className="px-2 text-2xl font-bold tracking-tight text-[#0B1F3A]">
            Aero<span className="text-accent">RUL</span>
          </Link>

          {/* Fleet Status Badge */}
          <div className="rounded-xl bg-[#EEF4FB] px-3.5 py-2.5">
            <p className="text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">FLEET STATUS</p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1F3A]">24 engines active</p>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 text-[13px] font-medium text-[#475569]">
            <Link
              to="/buyer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>

            <Link
              to="/marketplace"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Marketplace
            </Link>

            <Link
              to="/buyer/engines"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              My Engines
            </Link>

            <Link
              to="/admin/rul-status"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              RUL Analysis
            </Link>

            <Link
              to="/buyer/recommendations"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Replacement Recommendations
            </Link>

            {/* Active Link: Orders */}
            <div className="flex items-center gap-3 rounded-xl bg-[#0B1F3A] px-3.5 py-2.5 font-semibold text-white shadow-sm">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Orders</span>
            </div>
          </nav>
        </div>

        {/* Bottom Workspace & User Section */}
        <div className="flex flex-col gap-4 border-t border-[#E2E8F0] pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">SWITCH WORKSPACE</span>
            <div className="flex items-center justify-between rounded-lg bg-[#F1F5F9] px-2.5 py-1.5 text-xs font-semibold text-[#0B1F3A]">
              <span>Demo Horizon Airlines</span>
              <svg className="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1F3A] font-bold text-white text-xs">
              DP
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-bold text-[#0B1F3A]">Demo Procurement 1</span>
              <span className="truncate text-[11px] text-[#64748B]">demo.buyer@horizon.aero</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-8">
          <div className="flex items-center gap-3 w-96">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#94A3B8]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, suppliers, parts..."
                className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] py-1.5 pl-9 pr-3 text-xs text-[#0B1F3A] placeholder-[#94A3B8] transition focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B1F3A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#132A4A] transition"
            >
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Browse Marketplace
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {/* Header Title & Subtitle */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">Orders</h1>
              <p className="mt-1 text-xs text-[#64748B]">
                Track and manage procurement orders across certified suppliers
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-4">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === "ALL"
                    ? "bg-[#0B1F3A] text-white shadow-sm"
                    : "bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
                }`}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setStatusFilter("PROCESSING")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === "PROCESSING"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                In progress ({counts.processing})
              </button>
              <button
                onClick={() => setStatusFilter("CONFIRMED")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === "CONFIRMED"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Confirmed ({counts.confirmed})
              </button>
              <button
                onClick={() => setStatusFilter("SHIPPED")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === "SHIPPED"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-white text-sky-700 hover:bg-sky-50 border border-sky-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Shipped ({counts.shipped})
              </button>
              <button
                onClick={() => setStatusFilter("DELIVERED")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === "DELIVERED"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Delivered ({counts.delivered})
              </button>
            </div>
          </div>

          {/* Orders Table Container */}
          <div className="mt-6 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#0B1F3A]">No orders found</h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  No orders match your active filter. Browse the marketplace or check your replacement recommendations.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setStatusFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="rounded-lg border border-[#CBD5E1] px-3.5 py-1.5 text-xs font-semibold text-[#0B1F3A] hover:bg-[#F8FAFC]"
                  >
                    Clear filters
                  </button>
                  <Link
                    to="/marketplace"
                    className="rounded-lg bg-[#0B1F3A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#132A4A]"
                  >
                    Go to Marketplace
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                      <tr>
                        <th className="px-5 py-3">Order ID</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Items</th>
                        <th className="px-4 py-3">Supplier(s)</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {paginatedOrders.map((ord) => (
                        <tr
                          key={ord.id}
                          className="hover:bg-[#F8FAFC] transition cursor-pointer"
                          onClick={() => navigate(`/buyer/orders/${ord.orderNumber}`)}
                        >
                          <td className="px-5 py-4 font-mono font-bold text-[#0B1F3A]">
                            <div className="flex flex-col">
                              <span>{ord.orderNumber}</span>
                              <span className="font-sans text-[10px] text-[#94A3B8] font-normal">
                                Ref: {ord.purchaseReference}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[#475569]">{ord.placedDate}</td>
                          <td className="px-4 py-4 text-[#0B1F3A]">
                            <div className="max-w-xs font-medium truncate" title={ord.itemSummary}>
                              {ord.itemSummary}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[#475569]">
                            <div className="flex flex-wrap gap-1">
                              {ord.suppliers.map((sup, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block rounded bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#475569]"
                                >
                                  {sup}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-[#0B1F3A]">
                            ${ord.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(ord.orderStatus, ord.statusCategory)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              to={`/buyer/orders/${ord.orderNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] shadow-sm hover:bg-[#F1F5F9] transition"
                            >
                              <span>View</span>
                              <svg className="h-3 w-3 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-[#E2E8F0] bg-white px-5 py-3">
                  <span className="text-xs text-[#64748B]">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, filteredOrders.length)} of{" "}
                    {filteredOrders.length} orders
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-1 text-xs font-semibold text-[#0B1F3A] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                          currentPage === i + 1
                            ? "bg-[#0B1F3A] text-white"
                            : "border border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-1 text-xs font-semibold text-[#0B1F3A] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
