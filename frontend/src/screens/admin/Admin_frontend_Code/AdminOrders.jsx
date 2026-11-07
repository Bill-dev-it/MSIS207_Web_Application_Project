import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { fetchAdminOrders } from "../../../services/adminService";

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetchAdminOrders({
        status,
        search: debouncedSearch,
        page,
        limit: DEFAULT_PAGINATION.limit,
      });

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
      setOrders([]);
      setCounts(DEFAULT_COUNTS);
      setPagination(DEFAULT_PAGINATION);
      setError(err?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0B1F3A] antialiased">
      {/* Admin Sidebar Navigation */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-[#E5E7EB] bg-white px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Logo with ADMIN badge */}
          <div className="flex items-center gap-2 px-2">
            <Link
              to="/"
              className="text-2xl font-bold tracking-tight text-[#0B1F3A]"
            >
              Aero<span className="text-accent">RUL</span>
            </Link>
            <span className="rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-bold text-[#6D28D9]">
              ADMIN
            </span>
          </div>

          {/* Admin Nav Items */}
          <nav className="flex flex-col gap-1 text-[13px] font-medium text-[#475569]">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Users</span>
            </Link>

            <Link
              to="/admin/companies"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>Companies / Buyers</span>
            </Link>

            <Link
              to="/admin/suppliers"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span>Suppliers</span>
            </Link>

            <Link
              to="/admin/moderation"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <span>Products</span>
              </div>
            </Link>

            <Link
              to="/admin/categories"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <span>Categories</span>
            </Link>

            {/* Active Orders */}
            <div
              className="flex items-center gap-3 rounded-xl bg-[#0B1F3A] px-3.5 py-2.5 font-semibold text-white shadow-sm"
              aria-current="page"
            >
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>Orders</span>
            </div>

            <Link
              to="/admin/reports"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              <span>Reviews / Reports</span>
            </Link>

            <Link
              to="/admin/rul-status"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-3">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 12h4l3-9 4 18 3-9h4"
                  />
                </svg>
                <span>RUL System Status</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            </Link>

            <Link
              to="/admin/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>System Settings</span>
            </Link>
          </nav>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
          className="flex items-center gap-3 rounded-lg border-t border-[#F1F5F9] px-3 pt-4 text-[13px] font-semibold text-[#DC2626] transition-colors hover:text-[#B91C1C]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Logout</span>
        </button>
      </aside>

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
    </div>
  );
}

