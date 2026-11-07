import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import {
  fetchAdminOrderDetail,
  fetchAdminOrders,
} from "../../../services/adminService";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const DEFAULT_COUNTS = {
  ALL: 0,
  CONFIRMED: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  DELIVERED: 0,
};

const SEARCH_DEBOUNCE_MS = 300;

const STATUS_TABS = [
  { label: "All", value: "ALL" },
  { label: "Placed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
];

function formatCurrency(amount, currency = "USD") {
  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

function formatOrderNumber(orderNumber) {
  if (!orderNumber) return "—";
  const normalized = String(orderNumber).trim();
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAddressSnapshot(snapshot) {
  if (!snapshot) return null;

  let parsed = snapshot;
  if (typeof snapshot === "string") {
    try {
      parsed = JSON.parse(snapshot);
    } catch {
      return { raw: snapshot };
    }
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const lineParts = [
    parsed.address_line,
    parsed.city,
    parsed.region,
    parsed.postal_code,
    parsed.country_code,
  ].filter(Boolean);

  return {
    recipientName: parsed.recipient_name || null,
    phone: parsed.phone || null,
    addressLine: lineParts.length > 0 ? lineParts.join(", ") : null,
  };
}

function InfoField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#64748B]">
        {label}
      </p>
      <p className="break-words text-sm font-medium text-[#0B1F3A]">
        {value !== undefined && value !== null && value !== "" ? value : "—"}
      </p>
    </div>
  );
}

function OrderStatusBadge({ status }) {
  const normalized = String(status || "").toUpperCase();

  const badgeConfig = {
    CONFIRMED: {
      label: "Placed",
      className: "bg-[#F1F5F9] text-[#0B1F3A]",
    },
    PROCESSING: {
      label: "Processing",
      className: "bg-[#FEF3C7] text-[#B45309]",
    },
    SHIPPED: {
      label: "Shipped",
      className: "bg-[#DCFCE7] text-[#15803D]",
    },
    DELIVERED: {
      label: "Delivered",
      className: "bg-[#DBEAFE] text-[#1D4ED8]",
    },
  };

  const current = badgeConfig[normalized] || {
    label: status || "—",
    className: "bg-[#F1F5F9] text-[#475569]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

export default function AdminOrdersScreen() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  const loadOrders = useCallback(async () => {
    const currentRequestId = ++listRequestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const res = await fetchAdminOrders({
        status,
        search: debouncedSearch,
        page,
        limit: DEFAULT_PAGINATION.limit,
      });

      if (currentRequestId !== listRequestIdRef.current) {
        return;
      }

      const responseData = res?.data ?? {};

      setOrders(
        Array.isArray(responseData.items) ? responseData.items : []
      );
      setCounts({
        ...DEFAULT_COUNTS,
        ...(responseData.counts || {}),
      });
      setPagination(responseData.pagination ?? DEFAULT_PAGINATION);
    } catch (err) {
      if (currentRequestId !== listRequestIdRef.current) {
        return;
      }
      setOrders([]);
      setCounts(DEFAULT_COUNTS);
      setPagination(DEFAULT_PAGINATION);
      setError(err?.message || "Unable to load orders.");
    } finally {
      if (currentRequestId === listRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [status, debouncedSearch, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openOrderDetail = async (orderId) => {
    if (orderId === undefined || orderId === null || String(orderId).trim() === "") {
      return;
    }

    const stringOrderId = String(orderId).trim();
    const currentDetailReqId = ++detailRequestIdRef.current;

    setSelectedOrderId(stringOrderId);
    setSelectedOrder(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const res = await fetchAdminOrderDetail(stringOrderId);

      if (currentDetailReqId !== detailRequestIdRef.current) {
        return;
      }

      setSelectedOrder(res?.data ?? null);
    } catch (err) {
      if (currentDetailReqId !== detailRequestIdRef.current) {
        return;
      }

      setDetailError(err?.message || "Unable to load order details.");
    } finally {
      if (currentDetailReqId === detailRequestIdRef.current) {
        setDetailLoading(false);
      }
    }
  };

  const closeOrderDetail = () => {
    detailRequestIdRef.current += 1;
    setSelectedOrderId(null);
    setSelectedOrder(null);
    setDetailError("");
    setDetailLoading(false);
  };

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const totalPages = Math.max(Number(pagination.totalPages) || 1, 1);
  const currentPage = Number(pagination.page) || page;
  const allCount = Number(counts.ALL) || 0;

  return (
    <div className="flex min-h-screen flex-1 bg-[#F8FAFC] text-[#0B1F3A] antialiased">
      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-8">
          <div className="relative w-full max-w-lg">
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search listings, suppliers, catalog"
              aria-label="Search orders"
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] py-2 pl-10 pr-4 text-[13px] text-[#0B1F3A] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#0B1F3A] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              aria-label="Notifications"
              className="relative text-[#64748B] hover:text-[#0B1F3A]"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#CBD5E1]" />
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold leading-tight text-[#0B1F3A]">
                  Platform Admin
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Marketplace operations
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-1 flex items-center gap-1.5 text-xs text-[#64748B]">
            <Link to="/admin/dashboard" className="hover:text-[#0B1F3A]">
              Admin portal
            </Link>
            <span>›</span>
            <span className="text-[#64748B]">Orders</span>
          </div>

          {/* Page Title & Subtitle */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
              Orders
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Observe only. Admins do not change order status.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={loadOrders}
                className="shrink-0 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Status Filter Pills */}
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            {STATUS_TABS.map((tab) => {
              const isActive = status === tab.value;
              const labelText =
                tab.value === "ALL"
                  ? `All ${allCount.toLocaleString("en-US")}`
                  : tab.label;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleStatusChange(tab.value)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "border-[#0B1F3A] bg-[#0B1F3A] text-white"
                      : "border-[#E5E7EB] bg-white text-[#0B1F3A] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {labelText}
                </button>
              );
            })}
          </div>

          {/* Orders Table Card */}
          <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-separate border-spacing-x-4 border-spacing-y-0 text-left">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <th className="border-b border-[#E5E7EB] pb-3 font-semibold">
                      ORDER
                    </th>
                    <th className="border-b border-[#E5E7EB] pb-3 font-semibold">
                      BUYER
                    </th>
                    <th className="border-b border-[#E5E7EB] pb-3 font-semibold">
                      SUPPLIER(S)
                    </th>
                    <th className="border-b border-[#E5E7EB] pb-3 font-semibold">
                      TOTAL
                    </th>
                    <th className="border-b border-[#E5E7EB] pb-3 font-semibold">
                      STATUS
                    </th>
                    <th className="border-b border-[#E5E7EB] pb-3 font-semibold">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-sm text-[#64748B]"
                      >
                        Loading orders...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-sm text-[#64748B]"
                      >
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={String(order.order_id)}>
                        <td className="border-b border-[#F1F5F9] py-3.5 text-[13px] font-medium text-[#0B1F3A]">
                          {formatOrderNumber(order.order_number)}
                        </td>
                        <td className="border-b border-[#F1F5F9] py-3.5 text-[13px] text-[#0B1F3A]">
                          {order.company_name_snapshot || "—"}
                        </td>
                        <td className="border-b border-[#F1F5F9] py-3.5 text-[13px] text-[#0B1F3A]">
                          {order.suppliers_list || "—"}
                        </td>
                        <td className="border-b border-[#F1F5F9] py-3.5 text-[13px] font-medium text-[#0B1F3A]">
                          {formatCurrency(order.grand_total, order.currency)}
                        </td>
                        <td className="border-b border-[#F1F5F9] py-3.5">
                          <OrderStatusBadge status={order.primary_status} />
                        </td>
                        <td className="border-b border-[#F1F5F9] py-3.5 text-left">
                          <button
                            type="button"
                            onClick={() => openOrderDetail(order.order_id)}
                            className="text-[13px] font-medium text-[#0284C7] hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {!loading && orders.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9] pt-4">
                <p className="text-xs text-[#64748B]">
                  Page{" "}
                  <span className="font-semibold text-[#0B1F3A]">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#0B1F3A]">
                    {totalPages}
                  </span>{" "}
                  · Total{" "}
                  <span className="font-semibold text-[#0B1F3A]">
                    {Number(pagination.total) || 0}
                  </span>{" "}
                  orders
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={loading || currentPage >= totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                    className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Observe-Only Order Detail Modal */}
      {selectedOrderId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeOrderDetail();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-6 py-4">
              <div>
                <h2
                  id="order-detail-title"
                  className="text-lg font-bold text-[#0B1F3A]"
                >
                  {selectedOrder?.order_number
                    ? `Order ${formatOrderNumber(selectedOrder.order_number)}`
                    : "Order Details"}
                </h2>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  Observe only · Admins do not change order status
                </p>
              </div>

              <button
                type="button"
                onClick={closeOrderDetail}
                aria-label="Close order details"
                className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {detailError && (
                <div
                  role="alert"
                  className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <span>{detailError}</span>
                  <button
                    type="button"
                    onClick={() => openOrderDetail(selectedOrderId)}
                    className="shrink-0 font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {detailLoading ? (
                <div className="py-12 text-center text-sm text-[#64748B]">
                  Loading order details...
                </div>
              ) : selectedOrder ? (
                <div className="space-y-6">
                  {/* Master Order Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
                        Order Number
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-[#0B1F3A]">
                        {formatOrderNumber(selectedOrder.order_number)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <OrderStatusBadge
                        status={selectedOrder.primary_status}
                      />
                    </div>
                  </div>

                  {/* Buyer & Order Metadata */}
                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E5E7EB] p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoField
                      label="Order ID"
                      value={String(selectedOrder.order_id || "—")}
                    />
                    <InfoField
                      label="Purchase Reference"
                      value={selectedOrder.purchase_reference}
                    />
                    <InfoField
                      label="Placed At"
                      value={formatDateTime(selectedOrder.created_at)}
                    />
                    <InfoField
                      label="Currency"
                      value={selectedOrder.currency}
                    />
                    <InfoField
                      label="Buyer Company"
                      value={selectedOrder.company_name_snapshot}
                    />
                    <InfoField
                      label="Tax ID"
                      value={selectedOrder.tax_id_snapshot}
                    />
                    <InfoField
                      label="Placed By"
                      value={selectedOrder.placed_by_name}
                    />
                    <InfoField
                      label="Buyer Email"
                      value={selectedOrder.placed_by_email}
                    />
                  </div>

                  {/* Totals & Payment */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-[#E5E7EB] p-4">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                        Order Totals
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between text-[#475569]">
                          <span>Subtotal</span>
                          <span className="font-medium text-[#0B1F3A]">
                            {formatCurrency(
                              selectedOrder.subtotal,
                              selectedOrder.currency
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#475569]">
                          <span>Shipping Total</span>
                          <span className="font-medium text-[#0B1F3A]">
                            {formatCurrency(
                              selectedOrder.shipping_total,
                              selectedOrder.currency
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-2 font-bold text-[#0B1F3A]">
                          <span>Grand Total</span>
                          <span>
                            {formatCurrency(
                              selectedOrder.grand_total,
                              selectedOrder.currency
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E5E7EB] p-4">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                        Payment Information
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoField
                          label="Method"
                          value={
                            selectedOrder.payment?.payment_method ||
                            selectedOrder.payment_method
                          }
                        />
                        <InfoField
                          label="Status"
                          value={
                            selectedOrder.payment?.status ||
                            selectedOrder.payment_status
                          }
                        />
                        <InfoField
                          label="Paid At"
                          value={formatDateTime(
                            selectedOrder.payment?.paid_at ||
                              selectedOrder.paid_at
                          )}
                        />
                        <InfoField
                          label="Reference"
                          value={
                            selectedOrder.payment?.transfer_reference ||
                            selectedOrder.order_number
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Billing Addresses */}
                  {(selectedOrder.shipping_address_snapshot ||
                    selectedOrder.billing_address_snapshot) && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        {
                          title: "Shipping Address",
                          data: formatAddressSnapshot(
                            selectedOrder.shipping_address_snapshot
                          ),
                        },
                        {
                          title: "Billing Address",
                          data: formatAddressSnapshot(
                            selectedOrder.billing_address_snapshot
                          ),
                        },
                      ].map(
                        (addrSection) =>
                          addrSection.data && (
                            <div
                              key={addrSection.title}
                              className="rounded-xl border border-[#E5E7EB] p-4"
                            >
                              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                {addrSection.title}
                              </h3>
                              {addrSection.data.raw ? (
                                <p className="text-sm text-[#0B1F3A]">
                                  {addrSection.data.raw}
                                </p>
                              ) : (
                                <div className="space-y-1 text-sm text-[#475569]">
                                  {addrSection.data.recipientName && (
                                    <p className="font-semibold text-[#0B1F3A]">
                                      {addrSection.data.recipientName}
                                    </p>
                                  )}
                                  {addrSection.data.addressLine && (
                                    <p>{addrSection.data.addressLine}</p>
                                  )}
                                  {addrSection.data.phone && (
                                    <p className="text-xs text-[#64748B]">
                                      {addrSection.data.phone}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                      )}
                    </div>
                  )}

                  {/* Seller Orders & Items */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Seller Orders (
                      {Array.isArray(selectedOrder.seller_orders)
                        ? selectedOrder.seller_orders.length
                        : 0}
                      )
                    </h3>

                    {Array.isArray(selectedOrder.seller_orders) &&
                    selectedOrder.seller_orders.length > 0 ? (
                      selectedOrder.seller_orders.map((sellerOrder) => {
                        const items = Array.isArray(sellerOrder.items)
                          ? sellerOrder.items
                          : [];
                        const hasShipment =
                          sellerOrder.shipment_id ||
                          sellerOrder.carrier ||
                          sellerOrder.tracking_number ||
                          sellerOrder.shipped_at ||
                          sellerOrder.delivered_at;

                        return (
                          <div
                            key={String(sellerOrder.seller_order_id)}
                            className="overflow-hidden rounded-xl border border-[#E5E7EB]"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
                              <div>
                                <p className="text-sm font-bold text-[#0B1F3A]">
                                  {sellerOrder.supplier_name_snapshot || "—"}
                                </p>
                                <p className="text-xs text-[#64748B]">
                                  Seller Order #
                                  {String(sellerOrder.seller_order_id)} · Total{" "}
                                  {formatCurrency(
                                    sellerOrder.grand_total,
                                    selectedOrder.currency
                                  )}
                                </p>
                              </div>

                              <OrderStatusBadge status={sellerOrder.status} />
                            </div>

                            {hasShipment && (
                              <div className="grid grid-cols-1 gap-3 border-b border-[#F1F5F9] bg-white px-4 py-3 sm:grid-cols-4">
                                <InfoField
                                  label="Carrier"
                                  value={sellerOrder.carrier}
                                />
                                <InfoField
                                  label="Tracking Number"
                                  value={sellerOrder.tracking_number}
                                />
                                <InfoField
                                  label="Shipped At"
                                  value={formatDateTime(sellerOrder.shipped_at)}
                                />
                                <InfoField
                                  label="Delivered At"
                                  value={formatDateTime(
                                    sellerOrder.delivered_at
                                  )}
                                />
                              </div>
                            )}

                            {items.length > 0 && (
                              <div className="overflow-x-auto px-4 py-3">
                                <table className="w-full min-w-[600px] text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-[#E5E7EB] text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                                      <th className="pb-2">Product</th>
                                      <th className="pb-2">Part Number</th>
                                      <th className="pb-2">Condition</th>
                                      <th className="pb-2 text-right">Qty</th>
                                      <th className="pb-2 text-right">
                                        Unit Price
                                      </th>
                                      <th className="pb-2 text-right">
                                        Line Total
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#F1F5F9]">
                                    {items.map((item) => (
                                      <tr
                                        key={String(item.order_item_id)}
                                        className="text-[#0B1F3A]"
                                      >
                                        <td className="py-2.5 pr-3 font-medium">
                                          {item.product_name_snapshot || "—"}
                                        </td>
                                        <td className="py-2.5 pr-3 text-[#475569]">
                                          {item.part_number_snapshot || "—"}
                                        </td>
                                        <td className="py-2.5 pr-3 text-[#475569]">
                                          {item.condition_snapshot || "—"}
                                        </td>
                                        <td className="py-2.5 text-right">
                                          {item.quantity ?? "—"}
                                        </td>
                                        <td className="py-2.5 text-right">
                                          {formatCurrency(
                                            item.unit_price,
                                            selectedOrder.currency
                                          )}
                                        </td>
                                        <td className="py-2.5 text-right font-semibold">
                                          {formatCurrency(
                                            item.line_total,
                                            selectedOrder.currency
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-[#64748B]">
                        No seller orders available.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end border-t border-[#E5E7EB] pt-4">
                    <button
                      type="button"
                      onClick={closeOrderDetail}
                      className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                !detailError && (
                  <p className="py-10 text-center text-sm text-[#64748B]">
                    Order details are unavailable.
                  </p>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}


