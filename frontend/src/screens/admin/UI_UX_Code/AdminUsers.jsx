import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  fetchAdminUsers,
  fetchAdminUserDetail,
  updateAdminUserStatus,
} from "../../../services/adminService";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const ROLE_FILTERS = [
  { label: "All", value: "" },
  { label: "Buyers", value: "BUYER" },
  { label: "Suppliers", value: "SUPPLIER" },
  { label: "Admins", value: "ADMIN" },
];

// Delay before a search keyword is sent to the API.
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_FILTERS = [
  { label: "All Status", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

function Icon({ name, size = 18 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="5" rx="1" />
        <rect x="13" y="10" width="8" height="11" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
      </>
    ),
    shield: (
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
    ),
    activity: (
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-5 5" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    close: (
      <path d="m18 6-12 12M6 6l12 12" />
    ),
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {active ? "Active" : "Suspended"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function roleLabel(role) {
  const labels = {
    BUYER: "Buyer",
    SUPPLIER: "Supplier",
    ADMIN: "Admin",
  };

  return labels[role] || role || "—";
}

function InfoField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#64748B]">
        {label}
      </p>
      <p className="break-words text-sm font-medium text-[#0B1F3A]">
        {value ?? "—"}
      </p>
    </div>
  );
}

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Debounce the search keyword so the API is not called on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  // Load users from the Express Admin API.
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetchAdminUsers({
        role: role || undefined,
        status: status || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: DEFAULT_PAGINATION.limit,
      });

      setUsers(res?.data?.items ?? []);
      setPagination(
        res?.data?.pagination ?? DEFAULT_PAGINATION
      );
    } catch (err) {
      setUsers([]);
      setPagination(DEFAULT_PAGINATION);
      setError(err?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [role, status, debouncedSearch, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Open the detail panel and fetch the latest user information.
  const openUserDetail = async (userId) => {
    setSelectedUserId(userId);
    setSelectedUser(null);
    setActionError("");
    setDetailLoading(true);

    try {
      const res = await fetchAdminUserDetail(userId);
      setSelectedUser(res?.data ?? null);
    } catch (err) {
      setActionError(
        err?.message || "Unable to load user details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetail = () => {
    setSelectedUserId(null);
    setSelectedUser(null);
    setActionError("");
  };

  // Change the account status through the backend.
  const handleStatusChange = async (user) => {
    const nextStatus = user.is_active ? "INACTIVE" : "ACTIVE";

    const actionLabel =
      nextStatus === "INACTIVE" ? "suspend" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${user.full_name}?`
    );

    if (!confirmed) return;

    setUpdatingUserId(user.user_id);
    setActionError("");

    try {
      await updateAdminUserStatus(user.user_id, nextStatus);

      // Always reload from PostgreSQL through the API.
      await loadUsers();

      // Refresh the detail panel if it is currently open.
      if (String(selectedUserId) === String(user.user_id)) {
        const detailRes = await fetchAdminUserDetail(user.user_id);
        setSelectedUser(detailRes?.data ?? null);
      }
    } catch (err) {
      setActionError(
        err?.message || "Unable to update user status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleChange = (value) => {
    setRole(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const totalPages = Math.max(
    Number(pagination.totalPages) || 1,
    1
  );

  const currentPage = Number(pagination.page) || page;

  return (
    <div className="min-h-screen flex-1 bg-[#F8FAFC] text-[#0B1F3A]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white">
        <div className="flex min-h-[72px] items-center justify-between gap-4 px-5 lg:px-8">
          <div className="hidden max-w-md flex-1 md:block">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <Icon name="search" />
              </span>
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name, email or company..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#0B1F3A] focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">Platform Admin</p>
              <p className="text-xs text-[#64748B]">
                Marketplace operations
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1F3A] text-sm font-bold text-white">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-72px)]">
        {/* Main Content */}
        <main className="min-w-0 flex-1 p-5 lg:p-8">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-2 text-xs text-[#64748B]">
            <Link to="/admin" className="hover:text-[#0B1F3A]">
              Admin portal
            </Link>
            <span>›</span>
            <span className="font-semibold text-[#0B1F3A]">
              Users
            </span>
          </div>

          {/* Page Title */}
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
                Users
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">
                All accounts across roles
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5">
              <p className="text-xs text-[#64748B]">Total accounts</p>
              <p className="text-xl font-bold">
                {Number(pagination.total) || 0}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={loadUsers}
                className="shrink-0 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Action Error (shown here when the detail modal is closed) */}
          {actionError && !selectedUserId && (
            <div
              role="alert"
              className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError("")}
                aria-label="Dismiss error"
                className="shrink-0 font-semibold underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Filters */}
          <section className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {ROLE_FILTERS.map((item) => (
                  <button
                    key={item.value || "ALL"}
                    type="button"
                    onClick={() => handleRoleChange(item.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      role === item.value
                        ? "bg-[#0B1F3A] text-white"
                        : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="user-status-filter"
                  className="text-xs font-semibold text-[#64748B]"
                >
                  Status
                </label>
                <select
                  id="user-status-filter"
                  value={status}
                  onChange={(e) =>
                    handleStatusFilterChange(e.target.value)
                  }
                  className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#0B1F3A]"
                >
                  {STATUS_FILTERS.map((item) => (
                    <option key={item.value || "ALL"} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setRole("");
                    setStatus("");
                    setSearch("");
                    setDebouncedSearch("");
                    setPage(1);
                  }}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
                >
                  Reset filters
                </button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="relative mt-4 md:hidden">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <Icon name="search" />
              </span>
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name or email"
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0B1F3A]"
              />
            </div>
          </section>

          {/* Users Table */}
          <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
              <div>
                <h2 className="text-sm font-bold">User accounts</h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Manage buyer, supplier and administrator accounts
                </p>
              </div>

              <button
                type="button"
                onClick={loadUsers}
                disabled={loading}
                className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Joined</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E5E7EB]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-14 text-center text-sm text-[#64748B]"
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-14 text-center"
                      >
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="mb-3 rounded-full bg-[#F1F5F9] p-3 text-[#64748B]">
                            <Icon name="users" size={22} />
                          </div>
                          <p className="text-sm font-semibold text-[#0B1F3A]">
                            No users found
                          </p>
                          <p className="mt-1 text-xs text-[#64748B]">
                            Try changing your filters or search query.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.user_id}
                        className="transition hover:bg-[#FAFCFE]"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#0B1F3A]">
                            {user.full_name || "—"}
                          </p>
                          <p className="mt-1 text-xs text-[#64748B]">
                            {user.company_name || "No company"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#475569]">
                          {user.email || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#475569]">
                            {roleLabel(user.role)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#64748B]">
                          {formatDate(user.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge active={user.is_active === true} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                openUserDetail(user.user_id)
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0369A1] hover:underline"
                            >
                              <Icon name="eye" size={15} />
                              View
                            </button>

                            <button
                              type="button"
                              disabled={
                                updatingUserId === user.user_id
                              }
                              onClick={() => handleStatusChange(user)}
                              className={`text-xs font-semibold hover:underline disabled:opacity-50 ${
                                user.is_active
                                  ? "text-red-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {updatingUserId === user.user_id
                                ? "Updating..."
                                : user.is_active
                                  ? "Suspend"
                                  : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] px-5 py-4">
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
                  {pagination.total}
                </span>{" "}
                users
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading || currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="chevronLeft" size={15} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={loading || currentPage >= totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <Icon name="chevronRight" size={15} />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeUserDetail();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-6 py-4">
              <div>
                <h2
                  id="user-detail-title"
                  className="text-lg font-bold text-[#0B1F3A]"
                >
                  User details
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Account information
                </p>
              </div>

              <button
                type="button"
                onClick={closeUserDetail}
                aria-label="Close user details"
                className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="p-6">
              {actionError && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {actionError}
                </div>
              )}

              {detailLoading ? (
                <div className="py-12 text-center text-sm text-[#64748B]">
                  Loading user details...
                </div>
              ) : selectedUser ? (
                <>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-[#0B1F3A]">
                        {selectedUser.full_name || "—"}
                      </h3>
                      <p className="mt-1 text-sm text-[#64748B]">
                        {selectedUser.email || "—"}
                      </p>
                    </div>

                    <StatusBadge
                      active={selectedUser.is_active === true}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 border-t border-[#E5E7EB] pt-5 sm:grid-cols-2">
                    <InfoField
                      label="User ID"
                      value={selectedUser.user_id}
                    />
                    <InfoField
                      label="Role"
                      value={roleLabel(selectedUser.role)}
                    />
                    <InfoField
                      label="Company"
                      value={selectedUser.company_name}
                    />
                    <InfoField
                      label="Company Type"
                      value={selectedUser.company_type}
                    />
                    <InfoField
                      label="Company ID"
                      value={selectedUser.company_id}
                    />
                    <InfoField
                      label="Country Code"
                      value={selectedUser.country_code}
                    />
                    <InfoField
                      label="Tax ID"
                      value={selectedUser.tax_id}
                    />
                    <InfoField
                      label="Created At"
                      value={formatDate(selectedUser.created_at)}
                    />
                    <InfoField
                      label="Email Verified At"
                      value={formatDate(selectedUser.email_verified_at)}
                    />
                  </div>

                  <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-[#E5E7EB] pt-5">
                    <button
                      type="button"
                      onClick={closeUserDetail}
                      className="rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                    >
                      Close
                    </button>

                    <button
                      type="button"
                      disabled={
                        updatingUserId === selectedUser.user_id
                      }
                      onClick={() =>
                        handleStatusChange(selectedUser)
                      }
                      className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                        selectedUser.is_active
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {updatingUserId === selectedUser.user_id
                        ? "Updating..."
                        : selectedUser.is_active
                          ? "Suspend User"
                          : "Activate User"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="py-10 text-center text-sm text-[#64748B]">
                  User details are unavailable.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
