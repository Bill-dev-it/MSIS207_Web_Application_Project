import { useEffect, useState } from "react";
import { getAdminRulHealth } from "../../features/admin/services/adminApi";

export default function AdminRULHealthLive() {
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHealth() {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const response = await getAdminRulHealth({ signal: controller.signal });
        if (!controller.signal.aborted) {
          setState({ loading: false, error: "", data: response.data });
          setLastChecked(new Date());
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            loading: false,
            error: error.message || "Failed to contact RUL health service.",
            data: null,
          });
        }
      }
    }

    loadHealth();
    return () => controller.abort();
  }, [refresh]);

  const healthy = state.data?.status === "healthy" && state.data?.model_loaded === true;
  const modelUnloaded = state.data?.status === "healthy" && state.data?.model_loaded === false;

  let bannerTitle = "Prediction Service Operational";
  let bannerDescription = "The RUL model is loaded and ready to process prediction requests.";
  let bannerBadge = "Online";
  let bannerStatus = "healthy";

  if (healthy) {
    bannerTitle = "Prediction Service Operational";
    bannerDescription = "The RUL model is loaded and ready to process prediction requests.";
    bannerBadge = "Online";
    bannerStatus = "healthy";
  } else if (modelUnloaded) {
    bannerTitle = "AI Model Not Loaded";
    bannerDescription = "The prediction service is online, but the RUL model is not loaded.";
    bannerBadge = "Degraded";
    bannerStatus = "degraded";
  } else {
    bannerTitle = "Prediction Service Unavailable";
    bannerDescription = state.error || "The RUL inference service is currently unavailable or unreachable.";
    bannerBadge = "Offline";
    bannerStatus = "unavailable";
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            RUL Service Monitoring
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Live health verification of the internal Remaining Useful Life inference service.
          </p>
        </div>
        <button
          type="button"
          disabled={state.loading}
          onClick={() => setRefresh((v) => v + 1)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 text-slate-500 ${state.loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{state.loading ? "Checking…" : "Check Again"}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROMINENT STATUS CARD                                                  */}
      {/* ========================================================================= */}
      <section aria-label="RUL Service Status" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        {state.loading && !state.data && !state.error ? (
          <div className="py-8 text-center" role="status">
            <div className="inline-block w-8 h-8 border-3 border-slate-200 border-t-purple-600 rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700">Querying internal RUL service…</p>
            <p className="text-xs text-slate-400 mt-1">Connecting through Express backend proxy to FastAPI</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary Indicator Box */}
            <div
              className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                bannerStatus === "healthy"
                  ? "bg-emerald-50/70 border-emerald-200"
                  : bannerStatus === "degraded"
                  ? "bg-amber-50/70 border-amber-200"
                  : "bg-rose-50/70 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    bannerStatus === "healthy"
                      ? "bg-emerald-100 text-emerald-700"
                      : bannerStatus === "degraded"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {bannerStatus === "healthy" ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : bannerStatus === "degraded" ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2
                    className={`text-lg font-bold ${
                      bannerStatus === "healthy"
                        ? "text-emerald-900"
                        : bannerStatus === "degraded"
                        ? "text-amber-900"
                        : "text-rose-900"
                    }`}
                  >
                    {bannerTitle}
                  </h2>
                  <p
                    className={`text-xs ${
                      bannerStatus === "healthy"
                        ? "text-emerald-700"
                        : bannerStatus === "degraded"
                        ? "text-amber-700"
                        : "text-rose-700"
                    }`}
                  >
                    {bannerDescription}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-auto">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                    bannerStatus === "healthy"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : bannerStatus === "degraded"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}
                >
                  {bannerBadge}
                </span>
              </div>
            </div>

            {/* Diagnostic Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  SERVICE STATUS
                </span>
                <span className="mt-1 font-mono text-sm font-bold text-slate-800 block capitalize">
                  {state.data?.status || (state.error ? "Unavailable" : "—")}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  AI MODEL
                </span>
                <span className="mt-1 font-mono text-sm font-bold text-slate-800 block">
                  {state.data
                    ? state.data.model_loaded
                      ? "Loaded (Active)"
                      : "Not Loaded"
                    : state.error
                    ? "Not Loaded"
                    : "—"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  LAST CHECKED
                </span>
                <span className="mt-1 font-mono text-sm font-bold text-slate-800 block">
                  {lastChecked ? lastChecked.toLocaleString() : "—"}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
