import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../../features/admin/services/adminApi";

function formatUsd(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "Unavailable";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function StatCard({ label, value, link }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-500">{label}</h2>
      <p className="mt-2 text-2xl font-bold text-primary-800">{value}</p>
      {link && (
        <Link
          className="mt-3 inline-block text-sm font-medium text-accent underline"
          to={link.to}
        >
          {link.text}
        </Link>
      )}
    </section>
  );
}

export default function AdminDashboardLive() {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: "",
  });
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const response = await getAdminDashboard({
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setState({
            loading: false,
            data: response.data,
            error: "",
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            loading: false,
            data: null,
            error: error.message || "Unable to load Admin dashboard.",
          });
        }
      }
    }

    loadDashboard();

    return () => controller.abort();
  }, [refreshCount]);

  function handleRefresh() {
    setState((previous) => ({
      ...previous,
      loading: true,
      error: "",
    }));
    setRefreshCount((count) => count + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">
            Marketplace overview
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Actual PostgreSQL metrics · academic marketplace demo
          </p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </div>

      {state.loading && <p role="status">Loading dashboard data…</p>}

      {state.error && (
        <p className="rounded-lg bg-red-50 p-4 text-red-800" role="alert">
          {state.error}
        </p>
      )}

      {!state.loading && state.data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Buyer accounts" value={state.data.buyers} />
            <StatCard
              label="Approved suppliers"
              value={state.data.suppliers_approved}
            />
            <StatCard
              label="Pending suppliers"
              value={state.data.suppliers_pending}
              link={{ to: "/admin/suppliers", text: "Review suppliers" }}
            />
            <StatCard
              label="Active products / marketplace-visible listings"
              value={`${state.data.products_active} / ${state.data.listings_active}`}
            />
            <StatCard label="Orders" value={state.data.orders_total} />
            <StatCard
              label="Pending bank transfers"
              value={state.data.payments_pending}
              link={{ to: "/admin/payments", text: "Review payments" }}
            />
            <StatCard
              label="Succeeded payment volume (incl. simulation)"
              value={formatUsd(state.data.succeeded_payment_volume_usd)}
            />
            <StatCard
              label="RUL prediction records today (all statuses)"
              value={state.data.predictions_today}
            />
            <StatCard
              label="Registered RUL model"
              value={state.data.model_version || "Not registered"}
              link={{ to: "/admin/rul-health", text: "Check service health" }}
            />
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-primary-800">
              Succeeded payment volume (incl. simulation) · last six months
            </h2>
            {Array.isArray(state.data.sales_trend) &&
            state.data.sales_trend.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {state.data.sales_trend.map((row) => (
                  <div className="rounded-lg bg-neutral-50 p-3" key={row.month}>
                    <p className="text-xs text-neutral-600">{row.month}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-primary-800">
                      {formatUsd(row.total_usd)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-600">No sales data.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
