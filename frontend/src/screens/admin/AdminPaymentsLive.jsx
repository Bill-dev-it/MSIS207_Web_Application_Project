import { useEffect, useState } from "react";
import {
  cancelAdminPayment,
  confirmAdminPayment,
  listAdminPayments,
} from "../../features/admin/services/adminApi";

const STATUSES = ["PENDING", "SUCCEEDED", "CANCELLED", "ALL"];

function formatAmount(amount, currency) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(numeric);
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function AdminPaymentsLive() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [refreshCount, setRefreshCount] = useState(0);
  const [state, setState] = useState({ loading: true, rows: [], pagination: null, error: "" });
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadPayments() {
      setState((current) => ({ ...current, loading: true, error: "" }));
      try {
        const response = await listAdminPayments(
          { status, page, limit: 10 },
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) {
          const lastPage = Math.max(1, response.meta?.pagination?.totalPages ?? 1);
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
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            loading: false,
            rows: [],
            pagination: null,
            error: error.message || "Failed to load bank transfers.",
          });
        }
      }
    }

    loadPayments();
    return () => controller.abort();
  }, [status, page, refreshCount]);

  async function handlePaymentAction(payment, action) {
    if (busyOrderId !== null) return;

    const cancelling = action === "cancel";
    const question = cancelling
      ? `Cancel transfer for order ${payment.order_number}? Reserved stock may be restored.`
      : `Confirm receipt of bank transfer for order ${payment.order_number}?`;
    if (!window.confirm(question)) return;

    setBusyOrderId(payment.order_id);
    setNotice("");
    try {
      const response = cancelling
        ? await cancelAdminPayment(payment.order_id)
        : await confirmAdminPayment(payment.order_id);
      setNotice(`Order ${payment.order_number}: ${response.data?.status || "updated"}.`);
      setRefreshCount((count) => count + 1);
    } catch (error) {
      setNotice(`Unable to ${action} payment: ${error.message}`);
    } finally {
      setBusyOrderId(null);
    }
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
            Bank Transfer Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manual academic confirmation. No banking integration or automatic verification.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshCount((v) => v + 1)}
          disabled={state.loading || busyOrderId !== null}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 text-slate-500 ${state.loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER TOOLBAR & ACADEMIC NOTICE                                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Status Filter */}
        <div className="w-full sm:w-60">
          <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="admin-payment-status">
            Payment Status
          </label>
          <select
            id="admin-payment-status"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            value={status}
            disabled={busyOrderId !== null}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
              setNotice("");
            }}
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === "PENDING" ? "PENDING (Awaiting Review)" : item}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Demo Reminder Badge */}
        <div className="text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 max-w-md">
          <span className="font-semibold text-slate-700">Demo Environment: </span>
          Bank transfers are recorded with pending status. Administrator confirmation simulates funds clearing without real financial transactions.
        </div>
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
          <p className="text-sm font-medium text-slate-600">Loading bank transfer records…</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-sm font-semibold text-slate-700">No bank transfers found</p>
              <p className="text-xs text-slate-400 mt-1">
                There are no bank transfer records matching status "{status}".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-medium px-1">
                Showing {state.rows.length} of {totalRecords} record{totalRecords === 1 ? "" : "s"}
              </div>

              {state.rows.map((payment) => {
                const isPending = payment.status === "PENDING";
                const isSucceeded = payment.status === "SUCCEEDED";
                const isCancelled = payment.status === "CANCELLED";
                const isBusy = busyOrderId === payment.order_id;

                return (
                  <article
                    key={payment.payment_id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left: Order Info & Buyer */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-base font-bold text-slate-900 font-mono">
                            Order {payment.order_number}
                          </h2>
                          {/* Payment Status Badge */}
                          {isPending && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              PENDING VERIFICATION
                            </span>
                          )}
                          {isSucceeded && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              SUCCEEDED / CONFIRMED
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              CANCELLED
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            Buyer: <strong className="text-slate-800">{payment.buyer_company || "Direct Buyer"}</strong>
                          </span>
                          <span className="text-slate-300">·</span>
                          <span>
                            Transfer Ref: <strong className="font-mono text-slate-700">{payment.order_number}</strong>
                          </span>
                          {payment.created_at && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>Date: {formatDate(payment.created_at)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Middle: Amount */}
                      <div className="md:text-right shrink-0">
                        <span className="text-xs text-slate-400 block font-medium">Payment Amount</span>
                        <span className="text-xl font-bold font-mono text-slate-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </span>
                      </div>

                      {/* Right: Actions for PENDING */}
                      {isPending && (
                        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <button
                            type="button"
                            disabled={busyOrderId !== null}
                            onClick={() => handlePaymentAction(payment, "confirm")}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#0B1F3A] text-white hover:bg-slate-800 shadow-xs transition-colors disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{isBusy ? "Processing…" : "Confirm Received"}</span>
                          </button>
                          <button
                            type="button"
                            disabled={busyOrderId !== null}
                            onClick={() => handlePaymentAction(payment, "cancel")}
                            className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          >
                            Cancel Transfer
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
            <nav aria-label="Payments pagination" className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <button
                type="button"
                disabled={page <= 1 || state.loading || busyOrderId !== null}
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
                disabled={page >= totalPages || state.loading || busyOrderId !== null}
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
