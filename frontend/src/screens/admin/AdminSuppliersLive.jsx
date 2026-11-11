import { useEffect, useState } from "react";
import { approveAdminSupplier, listAdminSuppliers } from "../../features/admin/services/adminApi";

const STATUSES = ["PENDING", "APPROVED", "SUSPENDED"];

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

export default function AdminSuppliersLive() {
  const [status, setStatus] = useState("PENDING");
  const [queryText, setQueryText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({ loading: true, rows: [], pagination: null, error: "" });
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSuppliers() {
      setState((current) => ({ ...current, loading: true, error: "" }));
      try {
        const response = await listAdminSuppliers(
          { status, page, limit: 10, search },
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, response.meta?.pagination?.totalPages ?? 0);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setState({
          loading: false,
          rows: response.data || [],
          pagination: response.meta?.pagination,
          error: "",
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ loading: false, rows: [], pagination: null, error: error.message || "Failed to load suppliers." });
        }
      }
    }

    loadSuppliers();
    return () => controller.abort();
  }, [status, page, search, refresh]);

  async function approveSupplier(item) {
    if (busyId !== null) return;
    if (!window.confirm(`Approve supplier “${item.store_name}” (${item.company_name})?`)) return;
    setBusyId(String(item.supplier_id));
    setNotice("");
    try {
      const response = await approveAdminSupplier(item.supplier_id);
      setNotice(
        response.data.already_approved
          ? "Supplier was already approved."
          : `Supplier "${item.store_name}" approved successfully.`
      );
      setRefresh((value) => value + 1);
    } catch (error) {
      setNotice(`Approval failed: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(1);
    setSearch(queryText.trim());
  }

  function handleResetSearch() {
    setQueryText("");
    setSearch("");
    setPage(1);
  }

  const totalPages = Math.max(1, state.pagination?.totalPages ?? 0);
  const totalRecords = state.pagination?.totalRecords ?? state.rows.length;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Supplier Approvals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and approve registered commercial suppliers to grant catalog listing privileges.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefresh((v) => v + 1)}
          disabled={state.loading || busyId !== null}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 text-slate-500 ${state.loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER TOOLBAR                                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <form
          className="flex flex-col sm:flex-row sm:items-end gap-3"
          onSubmit={handleSearchSubmit}
        >
          {/* Status Dropdown */}
          <div className="w-full sm:w-48">
            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="supplier-status">
              Approval Status
            </label>
            <select
              id="supplier-status"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              value={status}
              disabled={busyId !== null}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              {STATUSES.map((val) => (
                <option key={val} value={val}>
                  {val === "PENDING" ? "PENDING (Needs Review)" : val}
                </option>
              ))}
            </select>
          </div>

          {/* Search Store / Company Input */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="supplier-search">
              Store or Company Name
            </label>
            <div className="relative">
              <input
                id="supplier-search"
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
                maxLength={120}
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
                placeholder="Search by store or company…"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition-colors"
              type="submit"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Notice Message */}
      {notice && (
        <div
          role="status"
          className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs font-medium text-blue-900 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-blue-500 hover:text-blue-800 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Loading state */}
      {state.loading && (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200" role="status">
          <div className="inline-block w-8 h-8 border-3 border-slate-200 border-t-[#0B1F3A] rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading supplier records…</p>
        </div>
      )}

      {/* Error state */}
      {state.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-800" role="alert">
          <span className="font-semibold">Error:</span> {state.error}
        </div>
      )}

      {/* Content list */}
      {!state.loading && !state.error && (
        <>
          {state.rows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm font-semibold text-slate-700">No suppliers found</p>
              <p className="text-xs text-slate-400 mt-1">
                No supplier records match status "{status}" {search ? `and search "${search}"` : ""}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-medium px-1">
                Showing {state.rows.length} of {totalRecords} supplier{totalRecords === 1 ? "" : "s"}
              </div>

              {state.rows.map((item) => {
                const isPending = item.status === "PENDING";
                const isApproved = item.status === "APPROVED";
                const isSuspended = item.status === "SUSPENDED";

                return (
                  <article
                    key={item.supplier_id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left: Supplier Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-base font-bold text-slate-900 break-words">
                            {item.store_name}
                          </h2>
                          {/* Status Badge */}
                          {isPending && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              PENDING APPROVAL
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              APPROVED
                            </span>
                          )}
                          {isSuspended && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              SUSPENDED
                            </span>
                          )}
                          {item.country_code && (
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.country_code}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-600 font-medium">
                          Company Legal Name: <span className="text-slate-800">{item.company_name}</span>
                        </p>

                        {/* Metadata row */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                          <div>
                            <span className="font-medium text-slate-600">Contact: </span>
                            {item.contact_name || "Not available"}
                            {item.contact_email ? ` (${item.contact_email})` : " (No email)"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-600">Registered: </span>
                            {formatDate(item.created_at)}
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span className="font-medium text-slate-600">Email Verified: </span>
                            {item.contact_email_verified_at ? (
                              <span className="text-emerald-700 font-semibold">Yes</span>
                            ) : (
                              <span className="text-slate-400">Not verified</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Approval Action */}
                      {isPending && (
                        <div className="shrink-0 sm:self-center">
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => approveSupplier(item)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#0B1F3A] text-white hover:bg-slate-800 shadow-xs transition-colors disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>
                              {busyId === String(item.supplier_id) ? "Approving…" : "Approve Supplier"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. PAGINATION                                                             */}
          {/* ========================================================================= */}
          {totalPages > 1 && (
            <nav aria-label="Supplier pagination" className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <button
                type="button"
                disabled={page <= 1 || state.loading || busyId !== null}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                &larr; Previous
              </button>
              <span className="font-mono text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || state.loading || busyId !== null}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next &rarr;
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
