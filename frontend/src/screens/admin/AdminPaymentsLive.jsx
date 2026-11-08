import { useEffect, useState } from "react";
import {
  cancelAdminPayment,
  confirmAdminPayment,
  listAdminPayments,
} from "../../features/admin/services/adminApi";

const STATUSES = ["PENDING", "SUCCEEDED", "CANCELLED", "ALL"];

function formatAmount(amount, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
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
          const lastPage = Math.max(1, response.meta.pagination.totalPages);
          if (page > lastPage) {
            setPage(lastPage);
            return;
          }
          setState({
            loading: false,
            rows: response.data,
            pagination: response.meta.pagination,
            error: "",
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ loading: false, rows: [], pagination: null, error: error.message });
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
      setNotice(`Order ${payment.order_number}: ${response.data.status}.`);
      setRefreshCount((count) => count + 1);
    } catch (error) {
      setNotice(`Unable to ${action} payment: ${error.message}`);
    } finally {
      setBusyOrderId(null);
    }
  }

  const totalPages = Math.max(1, state.pagination?.totalPages ?? 0);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-primary-800">Bank transfer management</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manual academic confirmation. No banking integration or automatic verification.
        </p>
      </header>

      <label className="flex max-w-xs flex-col gap-1 text-sm font-medium" htmlFor="admin-payment-status">
        Payment status
        <select
          id="admin-payment-status"
          className="rounded-lg border border-neutral-300 bg-white p-2"
          value={status}
          disabled={busyOrderId !== null}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
            setNotice("");
          }}
        >
          {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      {notice && <p role="status" className="rounded-lg bg-white p-3 text-sm">{notice}</p>}
      {state.loading && <p role="status">Loading bank transfers…</p>}
      {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{state.error}</p>}

      {!state.loading && !state.error && (
        <>
          {state.rows.length === 0 ? (
            <p className="rounded-lg bg-white p-5 text-neutral-600">No bank transfers for this filter.</p>
          ) : (
            <div className="space-y-3">
              {state.rows.map((payment) => (
                <article key={payment.payment_id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-primary-800">Order {payment.order_number}</h2>
                      <p className="mt-1 text-sm text-neutral-600">{payment.buyer_company} · {payment.status}</p>
                      <p className="mt-2 text-xl font-semibold text-primary-800">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Transfer reference: {payment.order_number}
                      </p>
                    </div>
                    {payment.status === "PENDING" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={busyOrderId !== null}
                          onClick={() => handlePaymentAction(payment, "confirm")}
                        >
                          Confirm received
                        </button>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busyOrderId !== null}
                          onClick={() => handlePaymentAction(payment, "cancel")}
                        >
                          Cancel transfer
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <nav aria-label="Bank transfer pages" className="flex flex-wrap items-center gap-3 text-sm">
            <button
              className="btn btn-secondary"
              type="button"
              disabled={page <= 1 || busyOrderId !== null}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages} · {state.pagination?.total ?? 0} payments</span>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={page >= totalPages || busyOrderId !== null}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </div>
  );
}

