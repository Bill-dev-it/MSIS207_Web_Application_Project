import { useEffect, useState } from "react";
import { approveAdminSupplier, listAdminSuppliers } from "../../features/admin/services/adminApi";

const STATUSES = ["PENDING", "APPROVED", "SUSPENDED"];
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "—";

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
          rows: response.data,
          pagination: response.meta?.pagination,
          error: "",
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ loading: false, rows: [], pagination: null, error: error.message });
        }
      }
    }

    loadSuppliers();
    return () => controller.abort();
  }, [status, page, search, refresh]);

  async function approveSupplier(item) {
    if (busyId !== null) return;
    if (!window.confirm(`Approve supplier “${item.store_name}”?`)) return;
    setBusyId(String(item.supplier_id));
    setNotice("");
    try {
      const response = await approveAdminSupplier(item.supplier_id);
      setNotice(response.data.already_approved
        ? "Supplier was already approved."
        : "Supplier approved successfully.");
      setRefresh((value) => value + 1);
    } catch (error) {
      setNotice(`Approval failed: ${error.message}`);
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, state.pagination?.totalPages ?? 0);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-primary-800">Supplier approval</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Admin can approve PENDING suppliers. Approval updates PostgreSQL.
        </p>
      </header>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(queryText.trim()); }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="supplier-status">
          Status
          <select
            id="supplier-status"
            className="rounded-lg border border-neutral-300 bg-white p-2"
            value={status}
            disabled={busyId !== null}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          >
            {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="supplier-search">
          Store / company
          <input
            id="supplier-search"
            className="rounded-lg border border-neutral-300 bg-white p-2"
            maxLength={120}
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Search suppliers"
          />
        </label>
        <button className="btn btn-secondary" type="submit">Search</button>
      </form>

      {notice && <p role="status" className="rounded-lg bg-white p-3 text-sm">{notice}</p>}
      {state.loading && <p role="status">Loading suppliers…</p>}
      {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{state.error}</p>}
      {!state.loading && !state.error && (
        <>
          {state.rows.length === 0 ? (
            <p className="rounded-lg bg-white p-5 text-neutral-600">No suppliers match this filter.</p>
          ) : (
            <div className="space-y-3">
              {state.rows.map((item) => (
                <article key={item.supplier_id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-semibold text-primary-800">{item.store_name}</h2>
                      <p className="text-sm text-neutral-600">
                        {item.company_name} · {item.country_code} · {item.status}
                      </p>
                      <p className="mt-2 break-words text-sm">
                        Contact: {item.contact_name || "Not available"} · {item.contact_email || "No account"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Registered: {formatDate(item.created_at)} · Email verified: {item.contact_email_verified_at ? "Yes" : "Not yet / unknown"}
                      </p>
                    </div>
                    {item.status === "PENDING" && (
                      <button
                        className="btn btn-primary self-start"
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => approveSupplier(item)}
                      >
                        {busyId === String(item.supplier_id) ? "Approving…" : "Approve supplier"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          <nav aria-label="Supplier pages" className="flex flex-wrap items-center gap-3 text-sm">
            <button
              className="btn btn-secondary" type="button"
              disabled={page <= 1 || state.loading || busyId !== null}
              onClick={() => setPage((value) => value - 1)}
            >Previous</button>
            <span>Page {page} of {totalPages} · {state.pagination?.total ?? 0} suppliers</span>
            <button
              className="btn btn-secondary" type="button"
              disabled={page >= totalPages || state.loading || busyId !== null}
              onClick={() => setPage((value) => value + 1)}
            >Next</button>
          </nav>
        </>
      )}
    </div>
  );
}

